---
title: "Optimizing Bulk Database Updates in .NET: From Naive to Lightning-Fast"
description: "Seven approaches to bulk-updating rows in PostgreSQL from .NET using Dapper and EF Core, from naive per-row updates to binary COPY — each cutting round-trips and dynamic SQL overhead."
publishedDate: March 14, 2026
category: Backend
poster: https://www.milanjovanovic.tech/blog-covers/mnw_185.png
---
Every outbox processor, job queue, and batch pipeline eventually encounters the same challenge: marking a set of rows as completed in bulk.

I recently faced this issue while optimizing an outbox processor, evaluating seven different methods against 1,000, 10,000, and 25,000 rows in PostgreSQL. For the 10,000-row test, the slowest method took 2,414ms, while the fastest clocked in at just 41ms. The primary bottleneck was rarely the SQL itself; rather, it was the frequency of database interactions.

### The Scenario

Consider a table of orders, each requiring two updates: a change in `status` to `"Processed"` and a unique `processed_at` timestamp for each row.

```sql
CREATE TABLE orders (
    id            UUID         NOT NULL PRIMARY KEY,
    customer_name TEXT         NOT NULL,
    status        TEXT         NOT NULL DEFAULT 'Pending',
    processed_at  TIMESTAMPTZ
);
```

The update payload consists of a straightforward record that pairs each order with its corresponding timestamp:

```csharp
record OrderUpdate(Guid Id, DateTime ProcessedAt);
```

With 10,000 of these updates, let's explore how each approach performs.

### Approach 1: Naive Dapper, One UPDATE Per Row

The most intuitive method is to loop through the list and execute one `UPDATE` statement for each row.

```csharp
await using var connection = new NpgsqlConnection(connectionString);
await connection.OpenAsync();
await using var transaction = await connection.BeginTransactionAsync();

foreach (var update in updates)
{
    await connection.ExecuteAsync(
        """
        UPDATE orders
        SET processed_at = @ProcessedAt,
            status       = 'Processed'
        WHERE id = @Id
        """,
        new { update.Id, update.ProcessedAt },
        transaction: transaction);
}

await transaction.CommitAsync();
```

With 10,000 rows, this results in 10,000 round-trips to the database. Each `ExecuteAsync` call sends the SQL, waits for a response from PostgreSQL, and then proceeds to the next one. This method took **2,414ms** in my benchmark, and over 6 seconds for 25,000 rows. The database itself is not slow; the issue lies in the constant back-and-forth communication.

### Approach 2: EF Core SaveChanges, Batched Round-Trips

EF Core optimizes performance by batching generated SQL statements, reducing the number of round-trips. By setting `MaxBatchSize` sufficiently high, you can send all 10,000 updates in significantly fewer network calls. The default batch size is 42. For further details, refer to the [EF Core efficient updating documentation](https://learn.microsoft.com/en-us/ef/core/performance/efficient-updating).

```csharp
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(connectionString, o => o.MinBatchSize(5000).MaxBatchSize(10000))
    .Options;

await using var db = new AppDbContext(options);

var ids = updates.Select(u => u.Id).ToHashSet();
var orders = await db.Orders
    .Where(o => ids.Contains(o.Id))
    .ToListAsync();

var updateMap = updates.ToDictionary(u => u.Id);

foreach (var order in orders)
{
    order.Status = "Processed";
    order.ProcessedAt = updateMap[order.Id].ProcessedAt;
}

await db.SaveChangesAsync();
```

This method shows a significant improvement over the previous approach, taking **1,030ms** for 10,000 rows—approximately half the time of Approach 1. However, it has hidden costs: the initial `SELECT` to load all 10,000 entities into the change tracker, and EF Core still generates 10,000 individual `UPDATE` statements, albeit in fewer round-trips.

### Approach 3: Dapper with a VALUES Table, One Statement, One Round-Trip

Instead of executing multiple statements, you can issue a single `UPDATE` that incorporates all new values using a derived `VALUES` table:

```sql
UPDATE orders
SET processed_at = v.processed_at,
    status       = 'Processed'
FROM (VALUES
    (@Id0, @ProcessedAt0),
    (@Id1, @ProcessedAt1),
    ...
) AS v(id, processed_at)
WHERE orders.id = v.id::uuid
```

Here's the corresponding C# code to construct and execute that statement:

```csharp
await using var connection = new NpgsqlConnection(connectionString);
await connection.OpenAsync();
await using var transaction = await connection.BeginTransactionAsync();

const string updateTemplate =
    @"""
    UPDATE orders
    SET processed_at = v.processed_at,
        status       = 'Processed'
    FROM (VALUES
        {0}
    ) AS v(id, processed_at)
    WHERE orders.id = v.id::uuid
    """;

var paramNames = string.Join(
    ",\n    ",
    updates.Select((_, i) => $"(@Id{i}, @ProcessedAt{i})"));

var sql = string.Format(updateTemplate, paramNames);

var parameters = new DynamicParameters();
for (int i = 0; i < updates.Count; i++)
{
    parameters.Add($"Id{i}", updates[i].Id.ToString());
    parameters.Add($"ProcessedAt{i}", updates[i].ProcessedAt);
}

await connection.ExecuteAsync(sql, parameters, transaction: transaction);

await transaction.CommitAsync();
```

In this case, PostgreSQL receives a single statement, constructs one execution plan, and updates all rows in one go. This method reduced execution time to **89ms** for 10,000 rows.

There is a trade-off: as the batch size increases, the SQL string grows. At 10,000 rows, you will have 10,000 parameter pairs in the query text. PostgreSQL has a **maximum of 65,535 parameters**, so while there is some headroom, this is a consideration for very large batch sizes. Approaches 6 and 7 circumvent this issue entirely.

### Approach 4: EF Core ExecuteSqlRaw, Same SQL Inside EF Core

The SQL remains identical to Approach 3. This method is beneficial if you are already operating within an EF Core `DbContext` and want your bulk update to share the same transaction as other EF Core operations.

```csharp
await using var db = new AppDbContext(options);
await using var transaction = await db.Database.BeginTransactionAsync();

var paramEntries = new List<NpgsqlParameter>();
var valueClauses = new List<string>();

for (int i = 0; i < updates.Count; i++)
{
    valueClauses.Add($"(@Id{i}::uuid, @ProcessedAt{i})");
    paramEntries.Add(new NpgsqlParameter($"Id{i}", updates[i].Id.ToString()));
    paramEntries.Add(new NpgsqlParameter($"ProcessedAt{i}", updates[i].ProcessedAt));
}

var sql = string.Format(updateTemplate, string.Join(",\n    ", valueClauses));

await db.Database.ExecuteSqlRawAsync(sql, paramEntries);

await transaction.CommitAsync();
```

The performance is comparable to Approach 3, as it executes the same SQL against the database. In my benchmark, it took **166ms** for 10,000 rows, slightly slower than Approach 3's 89ms. The minor difference is likely due to overhead from the EF Core transaction wrapper rather than the SQL execution itself. This approach allows for a combination of change-tracked operations and raw SQL within the same EF Core transaction. Note that `ExecuteSqlRawAsync` does not accept Dapper's `DynamicParameters`; you must use [`NpgsqlParameter`](https://www.npgsql.org/doc/api/Npgsql.NpgsqlParameter.html) objects directly. For a comprehensive overview of EF Core's raw SQL options, refer to [**this article**](https://www.milanjovanovic.tech/blog/ef-core-raw-sql-queries).

### Approach 5: Dapper CTE (WITH ... AS VALUES)

This method is a variation of Approach 3, utilizing a named CTE instead of an inline derived table:

```sql
WITH updates(id, processed_at) AS (
    VALUES
        (@Id0::uuid, @ProcessedAt0),
        (@Id1::uuid, @ProcessedAt1),
        ...
)
UPDATE orders
SET processed_at = updates.processed_at,
    status       = 'Processed'
FROM updates
WHERE orders.id = updates.id
```

Here’s the corresponding C# code to execute it:

```csharp
await using var connection = new NpgsqlConnection(connectionString);
await connection.OpenAsync();
await using var transaction = await connection.BeginTransactionAsync();

var valueClauses = string.Join(
    ",\n        ",
    updates.Select((_, i) => $"(@Id{i}::uuid, @ProcessedAt{i})"));

var sql =
    @$"""
    WITH updates(id, processed_at) AS (
        VALUES
            {valueClauses}
    )
    UPDATE orders
    SET processed_at = updates.processed_at,
        status       = 'Processed'
    FROM updates
    WHERE orders.id = updates.id
    """;

var parameters = new DynamicParameters();
for (int i = 0; i < updates.Count; i++)
{
    parameters.Add($"Id{i}", updates[i].Id.ToString());
    parameters.Add($"ProcessedAt{i}", updates[i].ProcessedAt);
}

await connection.ExecuteAsync(sql, parameters, transaction: transaction);

await transaction.CommitAsync();
```

This approach still results in a single statement and a single round-trip. PostgreSQL materializes the CTE once and performs the update by joining against it. In benchmarks, this method recorded a time of **103ms** for 10,000 rows, slightly trailing the plain `VALUES` approach at 89ms. The performance difference is minimal, making this more of a stylistic preference. Some teams opt for the CTE format when the update logic is more complex and they prefer to explicitly name the data source.

### Approach 6: Dapper with UNNEST (PostgreSQL)

For PostgreSQL users, a more efficient option is to use [`UNNEST`](https://www.postgresql.org/docs/current/functions-array.html). Instead of dynamically generating `@Id0` through `@Id9999`, you can pass two arrays as parameters and allow PostgreSQL to expand them:

```csharp
await using var connection = new NpgsqlConnection(connectionString);
await connection.OpenAsync();
await using var transaction = await connection.BeginTransactionAsync();

var ids = updates.Select(u => u.Id).ToArray();
var processedAts = updates.Select(u => u.ProcessedAt).ToArray();

await connection.ExecuteAsync(
    @"""
    UPDATE orders
    SET processed_at = v.processed_at,
        status       = 'Processed'
    FROM UNNEST(@Ids, @ProcessedAts) AS v(id, processed_at)
    WHERE orders.id = v.id
    """,
    new { Ids = ids, ProcessedAts = processedAts },
    transaction: transaction);

await transaction.CommitAsync();
```

This method is my preferred approach when working with PostgreSQL due to several advantages:

- **No dynamic SQL.** The query text remains constant, eliminating the need for `string.Format` or lengthy parameter lists.
- **Only two parameters.** `@Ids` and `@ProcessedAts` are passed, with Npgsql directly mapping `Guid[]` and `DateTime[]` to PostgreSQL array types.
- **Stable query plans.** Since the SQL remains unchanged, PostgreSQL can cache and reuse the execution plan, regardless of the number of rows being updated.
- **Scalability.** The query text remains fixed for any batch size; only the array data increases, and it is transmitted in a compact binary format.

The caveat is that `UNNEST` is specific to PostgreSQL. If your application needs to support multiple databases, consider using the `VALUES` approach from Approaches 3, 4, or 5, or investigate equivalent array expansion functions in your other database systems.

### Approach 7: Temp Table + Binary COPY

Previous methods transmit data as SQL parameters. However, at extreme batch sizes, this can become limiting due to the 65,535 parameter cap and the overhead of managing large parameter lists.

A different strategy is to bypass parameters altogether. Create a temporary staging table, bulk-load the data using [Npgsql's binary COPY](https://www.npgsql.org/doc/copy.html), and then execute a single `UPDATE ... FROM` statement.

```csharp
await using var connection = new NpgsqlConnection(connectionString);
await connection.OpenAsync();
await using var transaction = await connection.BeginTransactionAsync();

await connection.ExecuteAsync(
    @"""
    CREATE TEMP TABLE temp_updates (
        id           UUID        NOT NULL,
        processed_at TIMESTAMPTZ NOT NULL
    ) ON COMMIT DROP
    """,
    transaction: transaction);

await using (var writer = await connection.BeginBinaryImportAsync(
    "COPY temp_updates (id, processed_at) FROM STDIN (FORMAT BINARY)"))
{
    foreach (var u in updates)
    {
        await writer.StartRowAsync();
        await writer.WriteAsync(u.Id, NpgsqlTypes.NpgsqlDbType.Uuid);
        await writer.WriteAsync(u.ProcessedAt, NpgsqlTypes.NpgsqlDbType.TimestampTz);
    }
    await writer.CompleteAsync();
}

await connection.ExecuteAsync(
    @"""
    UPDATE orders
    SET processed_at = t.processed_at,
        status       = 'Processed'
    FROM temp_updates t
    WHERE orders.id = t.id
    """,
    transaction: transaction);

await transaction.CommitAsync();
```

Binary COPY is the most efficient data loading method provided by Npgsql. It bypasses the SQL parameter system, streaming rows directly in PostgreSQL's binary wire format. The `ON COMMIT DROP` clause ensures the temporary table is automatically removed at the end of the transaction.

While this method introduces complexity—creating a table, streaming data into it, and then executing the update—it remains efficient. For 10,000 rows, it completed in **41ms**, matching the performance of the UNNEST approach. For larger batch sizes (e.g., 100k+ rows), binary COPY is likely to outperform other methods, as the data payload increases while the query text remains constant, avoiding parameter limits.

### Benchmark Results

Here are the performance metrics across all three batch sizes:

```text
| Approach                                   | 1,000 rows | 10,000 rows | 25,000 rows |
| ------------------------------------------ | ---------- | ----------- | ----------- |
| Approach 1: Naive Dapper                   | 317ms      | 2,414ms     | 6,283ms     |
| Approach 2: EF Core SaveChanges            | 575ms      | 1,030ms     | 1,767ms     |
| Approach 3: Dapper + VALUES table          | 19ms       | 89ms        | 233ms       |
| Approach 4: EF Core ExecuteSqlRaw + VALUES | 58ms       | 166ms       | 282ms       |
| Approach 5: Dapper + CTE                   | 13ms       | 103ms       | 251ms       |
| Approach 6: Dapper + UNNEST                | 12ms       | 41ms        | 92ms        |
| Approach 7: Temp table + binary COPY       | 11ms       | 41ms        | 93ms        |
```

Several key observations emerge from the results. EF Core's `SaveChanges` outperforms naive Dapper at 10,000+ rows due to its batching capabilities, significantly reducing round-trips. However, both methods lag behind single-statement approaches. The most notable improvement is observed when transitioning from Approach 2 to Approach 3. The performance of Approach 5 (CTE) closely mirrors that of Approach 3 (VALUES), indicating that the choice between them is largely stylistic. Approaches 6 and 7 consistently deliver the best performance across all batch sizes, with the performance gap widening as the batch size increases.

### Summary

The primary takeaway from this analysis is straightforward: reducing round-trips is crucial, as individual SQL statements accumulate quickly.

Minimizing 10,000 database calls to just one is where the real performance gains are realized. Other optimizations are secondary.

Here are a few considerations to keep in mind:

- **EF Core `SaveChanges` is not designed for bulk updates.** While it reduces round-trips through batching, it still generates individual `UPDATE` statements and requires a `SELECT` to load the change tracker. For bulk modifications, raw SQL is a more suitable option. The same principle applies to inserts—this topic is covered in [**Fast SQL Bulk Inserts with C# and EF Core**](https://www.milanjovanovic.tech/blog/fast-sql-bulk-inserts-with-csharp-and-ef-core).
- **For PostgreSQL, `UNNEST` and binary COPY are optimal for large-scale operations.** Both methods utilize fixed query text that does not expand with batch size and do not have parameter count limitations. `VALUES` and CTE are excellent alternatives for smaller batches or when portability is a concern.
- **Dapper and EF Core can be used in tandem.** You do not need to choose one over the other; you can query with EF Core and perform bulk updates using raw SQL within the same transaction.

For those interested in further exploring SQL performance, I recently wrote about [**a common misconception regarding filter and join ordering in SQL queries**](https://www.milanjovanovic.tech/blog/debunking-the-filter-early-join-later-sql-performance-myth) that can mislead many developers.

Thank you for reading, and I look forward to connecting again next week.
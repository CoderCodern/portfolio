---
title: "Implementing the Inbox Pattern for Reliable Message Consumption"
publishedDate: April 4, 2026
category: System Design
poster: https://www.milanjovanovic.tech/blog-covers/mnw_188.png
---

The [**Outbox pattern**](https://www.milanjovanovic.tech/blog/implementing-the-outbox-pattern) has garnered significant attention, and for good reason. However, it's essential to consider the consumer side as well.


Your publisher reliably sends a message, and the broker delivers it. Your consumer processes the message, but then something goes awry—a timeout, a crash, or a network hiccup. The broker **redelivers the same message**, leading your consumer to execute the same logic twice. This scenario presents a challenge.


The **Inbox pattern** serves as a complementary approach to the Outbox. While the Outbox ensures dependable _publishing_, the Inbox guarantees reliable _consumption_. Each incoming message is processed **exactly once**, even in the event of broker retries.


Here's how to implement the Inbox pattern effectively.


## [Why You Need an Inbox](https://www.milanjovanovic.tech/blog/implementing-the-inbox-pattern-for-reliable-message-consumption#why-you-need-an-inbox)


Most message brokers operate on an **at-least-once delivery** model. This means the broker ensures that every message will be delivered, but it **does not** guarantee that each message arrives only once.


Consider this common failure scenario:

1. The broker delivers a message to your consumer.
2. Your consumer processes the message successfully.
3. Before the acknowledgment (ACK) reaches the broker, the connection drops.
4. The broker assumes the message was lost and redelivers it.
5. Your consumer processes the same message **twice**.

One potential solution is to make each handler [**idempotent**](https://www.milanjovanovic.tech/blog/the-idempotent-consumer-pattern-in-dotnet-and-why-you-need-it). While effective, this approach requires every consumer to check a deduplication table before executing any work. The Inbox pattern centralizes this functionality within a single infrastructure mechanism. I will discuss the trade-offs between the Inbox and the Idempotent Consumer later in the article.


The process works as follows:

1. A message arrives from the broker.
2. Instead of processing it immediately, **write it to an inbox table**.
3. If the message already exists (duplicate), the write operation is silently ignored.
4. A [**background process**](https://www.milanjovanovic.tech/blog/running-background-tasks-in-asp-net-core) reads unprocessed messages and handles them.

This decouples the reception of messages from their processing, allowing the consumer to function as a lightweight persistence layer that prevents duplicates.


![inbox_pattern_sequence_diagram.png](https://www.milanjovanovic.tech/blogs/mnw_188/inbox_pattern_sequence_diagram.png)


## [Inbox Database Schema](https://www.milanjovanovic.tech/blog/implementing-the-inbox-pattern-for-reliable-message-consumption#inbox-database-schema)


The `inbox_messages` table is designed to store every incoming message:


```sql
CREATE TABLE IF NOT EXISTS inbox_messages (
    id UUID PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    received_on_utc TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_on_utc TIMESTAMP WITH TIME ZONE NULL,
    error TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_unprocessed
ON public.inbox_messages (received_on_utc, processed_on_utc)
INCLUDE (id, type, content)
WHERE processed_on_utc IS NULL;
```


This structure mirrors the [**Outbox pattern's**](https://www.milanjovanovic.tech/blog/implementing-the-outbox-pattern) `outbox_messages` table. The `id` enables idempotent inserts through `ON CONFLICT DO NOTHING`. The filtered index keeps the index size manageable, as processed messages are automatically removed.


Messages exchanged between services utilize a shared `IntegrationEvent` base record:


```csharp
public abstract record IntegrationEvent(Guid MessageId);

public sealed record OrderCreatedIntegrationEvent(Guid OrderId)
    : IntegrationEvent(Guid.CreateVersion7());
```


## [Inbox Consumer](https://www.milanjovanovic.tech/blog/implementing-the-inbox-pattern-for-reliable-message-consumption#inbox-consumer)


The consumer is implemented as a [**MassTransit**](https://www.milanjovanovic.tech/blog/using-masstransit-with-rabbitmq-and-azure-service-bus) `IConsumer<T>`. Instead of processing the message directly, it **writes it to the inbox table** and returns. This is a straightforward operation.


We can create a generic implementation that works for any integration event:


```csharp
internal sealed class InboxConsumer<T>(NpgsqlDataSource dataSource)
    : IConsumer<T> where T : IntegrationEvent
{
    public async Task Consume(ConsumeContext<T> context)
    {
        await using var connection = await dataSource.OpenConnectionAsync(
            context.CancellationToken);

        const string sql =
            @"""
            INSERT INTO public.inbox_messages (id, type, content, received_on_utc)
            VALUES (@Id, @Type, @Content::jsonb, @ReceivedOnUtc)
            ON CONFLICT (id) DO NOTHING;
            """;

        await connection.ExecuteAsync(sql, new
        {
            Id = context.Message.MessageId,
            Type = typeof(T).FullName,
            Content = JsonSerializer.Serialize(context.Message),
            ReceivedOnUtc = DateTime.UtcNow
        });
    }
}
```


The `ON CONFLICT (id) DO NOTHING` clause performs the crucial task of ensuring that if the broker delivers the same message multiple times, the second insert is ignored without any error. If a crash occurs after the insert but before the ACK, the next delivery will be safely deduplicated.


## [Inbox Processor](https://www.milanjovanovic.tech/blog/implementing-the-inbox-pattern-for-reliable-message-consumption#inbox-processor)


The processor operates within a [**background service**](https://www.milanjovanovic.tech/blog/running-background-tasks-in-asp-net-core) or a [**scheduled job**](https://www.milanjovanovic.tech/blog/scheduling-background-jobs-with-quartz-net), fetching unprocessed messages in batches and dispatching them for handling.


```csharp
internal sealed class InboxProcessor(
    NpgsqlDataSource dataSource,
    IEventDispatcher eventDispatcher,
    ILogger<InboxProcessor> logger)
{
    private const int BatchSize = 1000;

    public async Task<int> Execute(CancellationToken cancellationToken = default)
    {
        await using var connection =
            await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction =
            await connection.BeginTransactionAsync(cancellationToken);

        var messages = (await connection.QueryAsync<InboxMessage>(
            @"""
            SELECT id AS Id, type AS Type, content AS Content
            FROM inbox_messages
            WHERE processed_on_utc IS NULL
            ORDER BY received_on_utc
            LIMIT @BatchSize
            FOR UPDATE SKIP LOCKED
            """,
            new { BatchSize },
            transaction: transaction)).AsList();

        var processedAt = DateTime.UtcNow;
        var results = new List<(Guid Id, DateTime ProcessedAt, string? Error)>(
            messages.Count);

        foreach (var message in messages)
        {
            try
            {
                var messageType = Type.GetType(message.Type)!;
                var deserialized = JsonSerializer.Deserialize(
                    message.Content, messageType)!;

                await eventDispatcher.DispatchAsync(deserialized, cancellationToken);

                results.Add((message.Id, processedAt, null));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to process inbox message {Id}", message.Id);
                results.Add((message.Id, processedAt, ex.ToString()));
            }
        }

        if (results.Count > 0)
        {
            await connection.ExecuteAsync(
                @"""
                UPDATE inbox_messages
                SET processed_on_utc = v.processed_on_utc,
                    error = v.error
                FROM UNNEST(@Ids, @ProcessedAts, @Errors)
                    AS v(id, processed_on_utc, error)
                WHERE inbox_messages.id = v.id
                """,
                new
                {
                    Ids = results.Select(r => r.Id).ToArray(),
                    ProcessedAts = results.Select(r => r.ProcessedAt).ToArray(),
                    Errors = results.Select(r => r.Error).ToArray()
                },
                transaction: transaction);
        }

        await transaction.CommitAsync(cancellationToken);

        return messages.Count;
    }
}
```

- **`FOR UPDATE SKIP LOCKED`** allows multiple processor instances to run concurrently without contention. This concept was previously discussed in [**scaling the Outbox pattern**](https://www.milanjovanovic.tech/blog/scaling-the-outbox-pattern).
- **Batch updates with** **`UNNEST`** facilitate writing all results in a single round-trip, utilizing the same [**bulk update approach**](https://www.milanjovanovic.tech/blog/optimizing-bulk-database-updates-in-dotnet).
- **Error handling**: Failed messages are marked with the corresponding exception, ensuring they do not block the queue.

In the event of a crash during batch processing, the transaction will roll back, allowing messages to be retrieved in the next run.


## [Things to Watch Out For](https://www.milanjovanovic.tech/blog/implementing-the-inbox-pattern-for-reliable-message-consumption#things-to-watch-out-for)


**Table growth.** The inbox table can grow indefinitely. To manage this, delete processed messages after a defined retention period, or consider partitioning by time range and dropping old partitions. Alternatively, you can archive them to another table if historical data is necessary.


**Poison messages.** If a message continually fails, it will be marked with an error each time. Implement a maximum retry count; after N failures, move the message to a dead-letter queue and send an alert.


**Ordering.** While `ORDER BY received_on_utc` provides a rough ordering based on arrival time, strict ordering is **not** guaranteed when using `SKIP LOCKED` with multiple processors. If you require [**per-aggregate ordering**](https://www.milanjovanovic.tech/blog/solving-message-ordering-from-first-principles), additional coordination will be necessary.


**Monitoring.** Keep an eye on the lag between `received_on_utc` and `processed_on_utc`. If this gap widens, consider increasing the batch size, decreasing the polling interval, or scaling out additional processor instances.


## [Inbox vs. Idempotent Consumer](https://www.milanjovanovic.tech/blog/implementing-the-inbox-pattern-for-reliable-message-consumption#inbox-vs-idempotent-consumer)


Both the Inbox and the [**Idempotent Consumer**](https://www.milanjovanovic.tech/blog/idempotent-consumer-handling-duplicate-messages) patterns prevent duplicate processing, but they differ in terms of _when_ processing occurs and _who controls_ the retries.


The [**Idempotent Consumer**](https://www.milanjovanovic.tech/blog/the-idempotent-consumer-pattern-in-dotnet-and-why-you-need-it) processes messages inline. It checks a deduplication table, performs the necessary work, and records the deduplication entry within the same transaction. If processing fails, the transaction rolls back, no deduplication record is created, and the **broker** will redeliver the message according to its own schedule. You have no control over the timing or backoff of retries.


In contrast, the Inbox pattern separates the reception of messages from their processing. The consumer writes the message and acknowledges it immediately, allowing the broker to proceed. If the processor encounters an error, it logs the issue and continues. You are responsible for managing retries: reset `processed_on_utc` to `NULL` for messages that fall under a retry threshold, or implement a separate loop to pick up failed messages after a delay.


Utilize the **Idempotent Consumer** when your side effects are transactional and broker-managed retries suffice. Opt for the **Inbox** when you require batching, custom retry policies, or horizontal scaling through `FOR UPDATE SKIP LOCKED`.


## [Summary](https://www.milanjovanovic.tech/blog/implementing-the-inbox-pattern-for-reliable-message-consumption#summary)


The Inbox pattern serves as the consumer-side counterpart to the [**Outbox pattern**](https://www.milanjovanovic.tech/blog/implementing-the-outbox-pattern).

- **`ON CONFLICT DO NOTHING`** ensures idempotent consumer inserts.
- **Separation of reception and processing** provides independent control over retries.
- **`FOR UPDATE SKIP LOCKED`** facilitates horizontal scaling of the processor.
- **Batch updates with** **`UNNEST`** minimize database round-trips.

If you're interested in how I develop [**event-driven systems**](https://www.milanjovanovic.tech/blog/event-driven-architecture-in-dotnet-with-rabbitmq) using these patterns, check out [**Modular Monolith Architecture**](https://www.milanjovanovic.tech/modular-monolith-architecture).


Thank you for reading!


Stay awesome!


---
title: "API Versioning Should Be Your Last Resort"
publishedDate: May 9, 2026
category: System Design
poster: https://www.milanjovanovic.tech/blog-covers/mnw_193.png
---
A live directory for your infrastructure that eliminates hardcoded ownership logic in your alert rules—this is the essence of Catalog by [**incident.io**](https://fandf.co/4cIIfB2). By simply adding a service and updating Catalog, your entire response system reconfigures itself seamlessly. [**Read the blog to learn more**](https://fandf.co/4cIIfB2).

[**Teleport**](https://fandf.co/3PhCocK) revolutionizes security by replacing static credentials with short-lived certificates tied to cryptographic identities. This unified identity layer and workflow spans servers, Kubernetes, databases, cloud, and MCP. Say goodbye to vaults, standing privileges, and secrets rotation. [**See how it works →**](https://fandf.co/3PhCocK)

Previously, I discussed the implementation of [**API versioning**](https://www.milanjovanovic.tech/blog/api-versioning-in-aspnetcore) in ASP.NET Core. However, a more pressing question arises: _when_ should you version an API?

Every API team inevitably considers the same solution:

> 
> Just create `v2`.
> 

While this may seem responsible, it leads to the maintenance of two APIs, two sets of documentation, two behaviors, and a migration project that clients will likely delay indefinitely.

I briefly touched on this in [**my article on common REST API design mistakes**](https://www.milanjovanovic.tech/blog/the-5-most-common-rest-api-design-mistakes-and-how-to-avoid-them), but I want to emphasize this point more clearly today:

**Versioning is a tool for compatibility, not a design strategy.**

Most API changes do not necessitate a new version; they require improved change management.

This distinction is crucial.

When you treat every contract change as a versioning issue, you risk duplicating APIs. Conversely, if you view it as a change management challenge, you begin to ask more insightful questions:

- Can I add instead of replace?
- Can old and new behaviors coexist temporarily?
- Can I introduce a new operation rather than altering an existing one?
- Can I safely deprecate this with telemetry and a migration path?

Adopting this mindset results in APIs that are more sustainable over time.

## [What Actually Breaks Clients?](https://www.milanjovanovic.tech/blog/api-versioning-should-be-your-last-resort#what-actually-breaks-clients)

Breaking changes are not solely about the URL.

Clients experience breakage when you:

- Remove or rename fields
- Alter the meaning of existing data
- Tighten request validation
- Modify pagination or error formats
- Assume enum-like values are permanently closed

This can disrupt a client just as effectively as deleting an endpoint:

```json
// Before
{ "total": 100 }

// After
{ "total": { "amount": 100, "currency": "USD" } }
```

You may not have changed the path or renamed the endpoint, yet you still broke clients.

Instead of asking, "Should this be v2?", consider, "Can the old and new contracts coexist safely?"

For the remainder of this article, I will use a simple `orders` API as an example.

## [The Compatibility Rules](https://www.milanjovanovic.tech/blog/api-versioning-should-be-your-last-resort#the-compatibility-rules)

To ensure an API ages gracefully, I adhere to four fundamental rules:

- Maintain existing fields and behaviors
- Avoid turning optional request data into required data
- Do not alter the functionality of an existing operation
- Ensure that anything new is additive and optional by default

These principles align with the four rules outlined in Z. Nemec's [API Change Management](https://medium.com/good-api/api-change-management-2fe5bba32e9b) article: do not remove anything, do not change processing rules, do not make optional elements mandatory, and ensure that any additions are optional.

By following these guidelines, many so-called "versioning problems" revert to standard contract evolution.

## [1. Add, Don't Replace](https://www.milanjovanovic.tech/blog/api-versioning-should-be-your-last-resort#1-add-dont-replace)

The safest change is often an additive one.

Imagine your original `GET /orders/{id}` response looked like this:

```json
{
  "id": "ord_123",
  "status": "paid",
  "total": 100
}
```

Instead of replacing `total`, you can add a new field:

```json
{
  "id": "ord_123",
  "status": "paid",
  "total": 100,
  "totalMoney": {
    "amount": 100,
    "currency": "USD"
  }
}
```

Existing clients can continue using `total`, while new clients can transition to `totalMoney`. You can mark the old field as deprecated and remove it only after a genuine migration period.

This principle extends beyond fields. If you require richer semantics, avoid altering a field's structure. Instead, introduce a new field, link, or operation that explicitly conveys the new meaning.

Sometimes, a less-than-ideal contract is the price of maintaining compatibility.

## [2. Make Clients Tolerant Readers](https://www.milanjovanovic.tech/blog/api-versioning-should-be-your-last-resort#2-make-clients-tolerant-readers)

A well-designed client should not fail simply because the server has added a field it does not recognize.

If the response evolves from this:

```json
{
  "id": "ord_123",
  "status": "paid"
}
```

to this:

```json
{
  "id": "ord_123",
  "status": "paid",
  "estimatedDeliveryDate": "2026-05-29"
}
```

Older clients should be able to ignore the additional property and continue functioning.

In .NET, `System.Text.Json` is advantageous because it ignores unknown properties by default. The real challenge often lies with overly strict generated SDKs or contract tests that demand exact JSON matches.

This is a common self-inflicted issue I observe. Teams claim they want backward compatibility, yet they generate client models that reject any unexpected fields in the response.

This approach is not a compatibility strategy; it is a pitfall.

Your server should be allowed to introduce optional data, while your clients should be robust enough to disregard what they do not understand.

## [3. Don't Change What an Existing Operation Does](https://www.milanjovanovic.tech/blog/api-versioning-should-be-your-last-resort#3-dont-change-what-an-existing-operation-does)

While fields and shapes often dominate compatibility discussions, the most perilous breaking changes often lie in **behavior**.

The URL remains unchanged, the request body stays the same, and the response structure is identical, yet the operation's functionality on the server has altered.

Consider `DELETE /orders/{id}`.

Initially, this endpoint performed a soft delete. The order transitioned to an `archived` state, remained in the database, continued to appear in audit reports, and could be restored by support.

The contract that clients relied upon encompassed more than just the HTTP verb and path; it included the full behavior:

- The order is recoverable
- Related invoices and shipments remain unaffected
- Audit history is preserved
- The same call can be retried safely

Months later, the team decides that soft deletes are too complicated. They "fix" the situation by converting `DELETE /orders/{id}` into a hard delete:

- The order row is permanently removed
- Related invoices are cascaded or orphaned
- Audit history loses references
- Retrying after a network interruption could delete the wrong record

No client noticed this during code review. The SDK call still compiles, and the response remains `204 No Content`. A support tool that previously called `DELETE` and then "undid" it now silently destroys data.

This scenario exemplifies the kind of change Z. Nemec's rules caution against: **you must not alter the processing rules of an existing operation.** Once clients have integrated, the behavior becomes part of the contract, even if it was never explicitly documented.

Similar patterns can occur in subtler ways:

- `POST /orders` was idempotent with a client-supplied key, then quietly ceased to be
- `POST /orders/{id}/cancel` used to trigger automatic refunds, then stopped issuing refunds because "refunds should be a separate call"
- `PUT /orders/{id}` was originally a full replace, then became a partial merge
- A webhook that previously fired once per order now fires per line item

Each of these changes maintains the URL, verb, and JSON structure while breaking existing integrations in ways that won't be evident in a schema diff.

The prudent approach remains the same: **add, don't mutate.**

If you need a hard delete, expose it as a new operation and leave the existing one intact:

```text
DELETE /orders/{id}            # still soft-delete, unchanged
DELETE /orders/{id}?purge=true # new, opt-in hard delete
```

Alternatively, introduce an entirely new resource (`DELETE /orders/{id}/purge`) so that the destructive behavior has its own name and permissions.

The guiding principle is clear: **once an operation is released, its behavior becomes part of the contract.** You can add new operations alongside it, deprecate it, but you cannot silently alter its functionality.

## [4. Be Very Careful With Validation](https://www.milanjovanovic.tech/blog/api-versioning-should-be-your-last-resort#4-be-very-careful-with-validation)

This aspect is often underestimated.

There are two variations of the same mistake:

- Changing an existing optional field to a required one
- Introducing a brand-new field and making it mandatory from the outset

Both scenarios disrupt older clients in the same way. The endpoint path remains unchanged, yet requests that previously succeeded are now rejected.

Consider this example with `POST /orders`.

Yesterday, this request was valid:

```json
{
  "customerId": "cus_123",
  "currency": "USD"
}
```

Today, the API requires a country for tax calculations:

```json
{
  "customerId": "cus_123",
  "currency": "USD",
  "country": "US"
}
```

Whether `country` was previously optional or nonexistent, the outcome is identical: every existing integration begins to fail at runtime.

A safer approach is to allow missing values for older clients, infer defaults where feasible, or create a new operation for the stricter workflow.

For instance:

- Accept missing `country` during a transition period
- Infer it from an existing billing profile if possible
- Introduce a new `POST /checkout-sessions` flow that requires the enhanced request model

While response changes typically undergo careful design review, request validation changes deserve equal attention. The underlying rule that encompasses both scenarios is simple: **anything added to the contract must be optional, and anything that was optional must remain optional.**

## [A New Operation Is Often Cheaper Than a New Version](https://www.milanjovanovic.tech/blog/api-versioning-should-be-your-last-resort#a-new-operation-is-often-cheaper-than-a-new-version)

At times, the use case may have evolved sufficiently that adding more flags and optional parameters to an existing endpoint becomes confusing.

This illustrates a poor evolution path:

```text
POST /orders?validateOnly=true&includeTaxEstimate=true&reserveInventory=true
```

At this juncture, you no longer have a single clean operation; instead, you have multiple workflows concealed behind one endpoint.

In such cases, I advocate for a new operation or resource rather than an entirely new API version.

```text
POST /orders
POST /orders/quote
POST /checkout-sessions
```

This approach preserves the old contract's stability while providing a clear home for the new behavior.

`POST /orders` remains the straightforward "place an order" endpoint, `POST /orders/quote` becomes the "provide a cost estimate" operation, and `POST /checkout-sessions` can support a more complex, guided flow without compromising the original contract.

This method is generally much more efficient than creating `/v2/orders` and dragging the rest of your API along with it.

## [Deprecate Like You Mean It](https://www.milanjovanovic.tech/blog/api-versioning-should-be-your-last-resort#deprecate-like-you-mean-it)

This is a critical yet often overlooked aspect of API change management.

Most deprecations are superficial. They may be documented, but no operational changes occur.

A genuine deprecation process should encompass four key elements:

1. Mark the old field or endpoint as deprecated in your OpenAPI description.
2. Signal the deprecation at runtime.
3. Provide consumers with a migration path.
4. Measure actual usage before removing anything.

For APIs using HTTP, runtime signaling can be straightforward, such as employing response headers like these:

```text
Deprecation: true
Sunset: Wed, 31 Dec 2026 23:59:59 GMT
Link: <https://docs.example.com/migrations/orders-total>; rel="deprecation"
```

This makes the deprecation visible in documentation, apparent in live traffic, and linked to a genuine migration guide.

Telemetry plays a crucial role here. If you are unaware of which clients still utilize the deprecated field or endpoint, you are not effectively managing change; you are merely guessing.

Track usage by client ID, API key, tenant, or application name, and wait until usage has significantly diminished before removing anything.

## [When Versioning Is Actually The Right Call](https://www.milanjovanovic.tech/blog/api-versioning-should-be-your-last-resort#when-versioning-is-actually-the-right-call)

I am not opposed to versioning.

Version when the old and new semantics cannot coexist safely. Version when the resource model has fundamentally changed. Version when adherence to compatibility rules would lead to a contract that is difficult to understand.

In such situations, versioning should be a deliberate choice.

Deliberate versioning means opting for the smallest break you can justify.

Sometimes this involves a new endpoint shape, a representation variant, or, particularly for public APIs, straightforward URL versioning, which is explicit and easy to communicate.

The critical factor is not the mechanism you choose, but that you resorted to it because coexistence was not feasible, rather than as a default option.

If you do choose to version, ensure it is accompanied by a robust deprecation process:

- Mark old fields or endpoints as deprecated
- Communicate a removal date
- Provide clients with migration examples
- Monitor usage before removing anything

The real challenge lies not in creating `v2`, but in transitioning consumers away from `v1`.

## [Takeaway](https://www.milanjovanovic.tech/blog/api-versioning-should-be-your-last-resort#takeaway)

The most effective API version is often the one you never have to create.

For a straightforward decision-making rule, consider the following:

1. Can I add instead of replace?
2. Can old and new contracts coexist during a migration window?
3. Can I introduce a new operation instead of altering an existing one?
4. Can I deprecate the old structure with documentation, headers, and telemetry?

If the answer is yes, you likely do not need a new version.

If the answer is no, and the old and new paradigms cannot coexist, version deliberately.

That is the crux of the matter.

Design contracts to evolve. Treat clients as long-term integrations, not just today's code. Reserve versioning for scenarios where compatibility genuinely reaches its limit.

For a deeper exploration of designing and evolving HTTP APIs, check out [**Pragmatic REST APIs**](https://www.milanjovanovic.tech/pragmatic-rest-apis). In this resource, I delve into the patterns, trade-offs, and implementation details I employ when building APIs that must endure real clients and real changes.

Thank you for reading.

Stay awesome!
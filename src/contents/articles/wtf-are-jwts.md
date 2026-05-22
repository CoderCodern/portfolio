---
title: "WTF Are JWTs?"
description: "Every day, when you use the web, you use JWTs frictionlessly. "
publishedDate: February 9, 2025
category: Backend
---

## **WTF Are JWTs?**


![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/effcaeb0-736a-4d67-81a8-ab23b54a0483/3c8acf17-987c-4bd3-ba8f-316e164620cc/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466QBGG5UKR%2F20260517%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260517T150635Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCqQtJanAptHARkSHy8DqsNtoxzjaNn%2B8k9m14iycvVRQIgXCFsKEtYpfuQyJrVp7RxBaL%2BR8RwuEg9Uew9JpQFJHsqiAQIqP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDGjY6mK2mLFThj%2BFTCrcA3eBnyTWpVXMhJVZ%2FmPhqlQUAsxuu3KS7eJkyg67XLApHIvPP2mSU%2B68Lndoop0zJmdKM5Ae7hbZQBhPPIqW3YL6t%2FytMes9ChMt4CqprFQpkMCpHH0WceY4NaDkrfg%2FGtjM34wo0ZmlXrmu7gI9hG5lzsGONGKe51pH1RwtGXpY%2FFGYhqoeaHGeCuRgZtoZ%2FK5weO4IKK7KkopJhNiTINcXmAEtZgokHty29mOGMe7Zw6tI53FuMfy3Re%2F9yEa9ZsUd8LiKUO3Lur3ZRo2a1jY8degZyGXWuAXRAWMzf8h8YGXuCNbHIzkbJaNz%2FGPrAuYCUgD%2FxT1TjvxjX%2FHlydXS6bGS1ne2PhxzKPp86oy2PdVqpXkTFu8HfFBcwC7JxZ1ecPsZD70cOC4Q0GjHyoqCqpDfyflaBRETTjV1kKlLCJdaO4j8gUZo%2FabpmAZap%2F44usaZTjKiCr9mtPpcAHC%2BTk6tM1WmfRSPj4PV5Z7HQouX9eoKztUFW79HyvRL9XZH4VdYTyFmv%2FlZhJhIoa1cTBxjpmysuTsOn%2BGn7HlTYY4OS5Dzl2PiWGapGA6vf6oPCK%2BDGqYtzP1iJBym3VbcxA2FBvXG07GoVxFnLKSGOMexeZTWp2jk9JdeML2tp9AGOqUBN1ENC4s9OAeSdnueXjY3drneIY2s%2FrpWJpcNbUVt6YR9JxlIXJiJuPQzhIGi9X6%2BG9aWcOgJyYsOJqTUgRrgf8QhQug70HIrGt5%2BhjEN%2Ba4dwwywQMC5G04uRctHrpFB6HwMf14MirQE2SOTcnQWuChWJihx%2BrbmPmdsjyOH0inh487fhvsmrZ%2F%2BVeIvgMZDQeIqBxA8YUpqeVS68UOCfeeLhJWl&X-Amz-Signature=cef4fa5449c62295425dfd461ac086b1f192911e9bb11216b21e40a480e4961a&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


We recently launched [Neon Authorize](https://neon.tech/blog/introducing-neon-authorize) to simplify Postgres authorization with row-level security.


If you’ve been reading our posts, [tutorials](https://neon.tech/docs/guides/neon-authorize-tutorial), or [READMEs](https://github.com/neondatabase-labs/clerk-nextjs-neon-authorize) on the subject, you’ll have come across three little letters: JWT. This whole world seems to run on JWTs–so what are they?


JWTs, or JSON Web Tokens to give them their full titles, or JOTs to give their weird pronunciation, are standardized, compact, self-contained tokens for transmitting information. They are JSON objects that are digitally signed so each party can trust and verify the information.


Every day, when you use the web, you use JWTs frictionlessly. The same goes for Neon Authorize. Unless you want to go full custom, your auth provider–Clerk, Auth0, Stack Auth, and so on–will take care of this for you. But if you want to implement Neon Authorize in your application, it doesn’t hurt to understand what is happening under the hood with the JWTs flying around. That’s what we’re going to do here.


### **The History of the JWT**


JSON Web Tokens emerged in the early 2010s as part of a broader evolution in web authentication.


Before JWTs, [session-based authentication](https://roadmap.sh/guides/session-based-authentication) was the norm–servers would create a session ID, store it in a database, and send it to the client as a cookie. While this worked, it had scaling limitations: every authentication request needed a database lookup, and session state had to be shared across multiple servers.


The need for a more efficient, stateless authentication method grew alongside the rise of mobile apps, single-page applications (SPAs), and distributed systems. Traditional session-based auth wasn’t cutting it anymore. Developers needed something that could work across domains, platforms, and services without constant database hits.


Enter JWTs. In May 2015, JWT was standardized as [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519) by the Internet Engineering Task Force (IETF). The standard defined _“a compact, URL-safe means of representing claims to be transferred between two parties.”_ Their self-contained nature made JWTs revolutionary. All the necessary information is in the token, cryptographically signed to ensure authenticity.


The format quickly gained traction because it solved several critical problems:

- Stateless authentication: No need to store session information server-side
- Cross-domain compatibility: Easy to use across different domains and services
- Scalability: Reduced database load for auth checks
- Flexibility: Could carry any JSON-serializable data
- Security: Built-in verification through digital signatures

Today, JWTs have become the de facto standard for modern web authentication. They’re particularly valuable in microservices architectures where different services must verify user identity and permissions without sharing a session database.


### **The Structure of a JWT**


A JWT consists of three base64-encoded segments, separated by dots: header.payload.signature. This simplicity and elegance of JWTs belie their power in solving complex distributed authentication challenges.


Let’s break down each part.

<details>
<summary>**The Header**</summary>

The header contains metadata about the token itself. It’s typically just two fields:


```json
{
  "alg": "HS256",    // the algorithm used for signing
  "typ": "JWT"       // specifies this is a JWT
}
```


</details>

<details>
<summary>**The Payload**</summary>

This is where the good stuff lives. The payload (also called the “claims”) contains the actual data you want to transmit. If we look at what a Clerk JWT might include, we can start to understand this payload.


First, default claims. These, usually prefixed with three letters, are added automatically to each JWT:


```json
{
  // Default claims, included automatically by the auth provider
  "azp": "http://localhost:3000",   // Authorized party - client that requested the token
  "exp": 1639398300,             // Expiration time - timestamp the token becomes invalid
  "iat": 1639398272,                  // Issued at - timestamp when the token was created
  "iss": "https://clean-mayfly-62.clerk.accounts.dev", // Issuer created/signed the token
  "nbf": 1639398220,                  // Not before - timestamp before which token should not be accepted
  "sid": "sess_2ehYpzsasKNOZrpqPZ9yDWhrYVe",  // Session ID - unique identifier for this session
  "sub": "user_1deJLArSTiWiF1YdsEWysnhJLLY"   // Subject - unique identifier for the user
...
```


These standardized claims, defined in RFC 7519, serve specific purposes:

- `azp` and iss help identify where the token came from
- `exp`, iat, and nbf handle token lifecycle and validity period
- `sid` and sub identify the session and user, respectively

You can then add the custom claims. A JWT from an auth provider like Clerk might have these fields:


```json
...
  "user_id": "user_abcdef123456789",
  "avatar": "https://example.com/avatar.jpg",
  "full_name": "Doe Maria",
  "email": "maria@example.com",
}
```


So, the entire payload would look like this:


```json
{
  "azp": "http://localhost:3000",
  "exp": 1639398300,             
  "iat": 1639398272,                  
  "iss": "https://clean-mayfly-62.clerk.accounts.dev", 
  "nbf": 1639398220,                  
  "sid": "sess_2ehYpzsasKNOZrpqPZ9yDWhrYVe",  
  "sub": "user_1deJLArSTiWiF1YdsEWysnhJLLY"
  "user_id": "user_abcdef123456789",
  "avatar": "https://example.com/avatar.jpg",
  "full_name": "Doe Maria",
  "email": "maria@example.com",
}
```


</details>

<details>
<summary>**The Signature**</summary>

The signature is what makes JWTs secure. It’s created by taking the encoded header, encoded payload, and a secret key, then running them through the algorithm specified in the header:


```javascript
HMACSHA256(
  base64UrlEncode(header) + "." + 
  base64UrlEncode(payload),
  secret
)
```


Let’s do that with the above header and payload. Here’s some quick code that will create a JWT with the above header, payload, and a secret:


```javascript
function base64UrlEncode(str) {
 // Convert string to base64 and make URL safe
 return Buffer.from(str)
   .toString('base64')
   .replace(/\+/g, '-')
   .replace(/\//g, '_')
   .replace(/=/g, '');
}

function createJWT(header, payload, secret) {
 // Convert header and payload to strings
 const headerStr = JSON.stringify(header);
 const payloadStr = JSON.stringify(payload);

 // Base64Url encode header and payload
 const encodedHeader = base64UrlEncode(headerStr);
 const encodedPayload = base64UrlEncode(payloadStr);

 // Create signature input
 const signatureInput = encodedHeader + '.' + encodedPayload;

 // Create HMAC SHA256 signature
 const crypto = require('crypto');
 const signature = crypto
   .createHmac('sha256', secret)
   .update(signatureInput)
   .digest('base64')
   .replace(/\+/g, '-')
   .replace(/\//g, '_')
   .replace(/=/g, '');

 // Combine all parts
 return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Example usage:
const header = {
 "alg": "HS256",
 "typ": "JWT"
};

const payload = {
 "azp": "http://localhost:3000",
 "exp": 1639398300,
 "iat": 1639398272,
 "iss": "https://clean-mayfly-62.clerk.accounts.dev",
 "nbf": 1639398220,
 "sid": "sess_2ehYpzsasKNOZrpqPZ9yDWhrYVe",
 "sub": "user_1deJLArSTiWiF1YdsEWysnhJLLY",
 "user_id": "user_abcdef123456789",
 "avatar": "https://example.com/avatar.jpg",
 "full_name": "Doe Maria",
 "email": "maria@example.com"
};

const secret = "neonauthorizeiscool";

const token = createJWT(header, payload, secret);
console.log(token);
```


We get this:


```json
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE2MzkzOTgzMDAsImlhdCI6MTYzOTM5ODI3MiwiaXNzIjoiaHR0cHM6Ly9jbGVhbi1tYXlmbHktNjIuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNjM5Mzk4MjIwLCJzaWQiOiJzZXNzXzJlaFlwenNhc0tOT1pycHFQWjl5RFdocllWZSIsInN1YiI6InVzZXJfMWRlSkxBclNUaVdpRjFZZHNFV3lzbmhKTExZIiwidXNlcl9pZCI6InVzZXJfYWJjZGVmMTIzNDU2Nzg5IiwiYXZhdGFyIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9hdmF0YXIuanBnIiwiZnVsbF9uYW1lIjoiRG9lIE1hcmlhIiwiZW1haWwiOiJtYXJpYUBleGFtcGxlLmNvbSJ9.ld8fOURGSNnnDHUWqo_T4WiRCQPQPpcLQh7SyJlN3Es
```


We can head to [jwt.io](https://jwt.io/#debugger-io) and input our JWT to decode the data:


![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/effcaeb0-736a-4d67-81a8-ab23b54a0483/10544e49-4bbc-4a0b-b776-7c78f9add523/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4667LZZYSCZ%2F20260517%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260517T150637Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjENz%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIGyhgeRg%2BY4TrPOfSNFia8FIatQPflbIQ%2BpeMG%2FePxKHAiAyIWi5Lge1WYli7niDxHuU96MiS4ezzohk4Fsj8e36WiqIBAil%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDYzNzQyMzE4MzgwNSIMpXjrJJBAHUqiOTnCKtwDUJP25v988XlbAiCxlAerDazLGUOG%2B4WebrQzpSKpLqvny2pBxW8Ok0GYuDZxaWn0z8miSwacpccohqwlO3yR%2BJVkUsa%2F6So0q%2F3n1Tq5Ob6COE2t%2FCMCrJHCIX%2BKuwbxS2KKKdyJVOWPLZj%2FUiV0qbOeO%2BurRoi%2FFEcvmjJYfWuScY4rsoSbFIaz9jU9IRwITJ7TUajI%2BpDusGms96A668A4CktsI9vWEtbBDDwFJiKdvf0xYr6MuFJCnQ2NXGJXHky4%2BNh2rzgqTCVB%2BWU6tcjGBSE1a6xszN1S%2Fb2l891p47vTAE5mbRwxQA5nRv8N6y1bg8nOZuHh47DiTlWlnPl83H%2B0zsL%2FMvTxwrkZUzgvX9eANr3JZ8VZOofhmfiim%2FOyDfRUUb%2Brb9la74zqtlv2IEI5OwF2tXCylAwNZdCqFbdvUgnxVIA0WoHrPfOPiwekUcSM5Inb2UW%2BrYqEM45vhUHt9W0RDy63OchWNX%2Bpw5RpDunF6ahmfCEJWELseMmKsByYaXlOmBHj7RYFVFWJ7AeqxKm86dKY5nYbOmZ%2F3%2Fw9M0Co8OEMlhbC8szq86ZAJcByRUvUDPg0kjSuJaGJerFp6D4PQV2K%2B%2FGolllaCd5IEB9uYW8uaBswg82m0AY6pgEar7CNYVmGd%2BFl6Utp3%2FD%2F25pxNDIspyfw7HzkTpQC%2BXdlx3owCfAFlY%2B623NNTWsQ5N75wSD4BOE2MfoJ73szS8bONeOBl0OkOyq%2F9OdjnYE9mdhsiYPuroRrcyE2t7ZNSybMEQZu%2FFm4wZd563HNofRMofTprKRlvwseXGdN1qqZLUs0m%2BhiWvW76hM7XZTJ%2FwQxk5SQeftw7n5y3fO0X1i9prZW&X-Amz-Signature=c724cd75e174705e8b515022211c03aaaf83f99c48a07a4d5bd71f7144dc70fe&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


Each part is visible, separated by dots. Each part is base64url-encoded, so it’s safe to use in URLs and easy to transmit.


For Neon Authorize, we’re particularly interested in the payload claims. We’ll use these to make authorization decisions in our row-level security policies. For example, if your JWT includes a tenant_id, you can use that to ensure users only see data from their organization.


</details>


### **WTF Are JWKS**


You can see that the secret is an essential part of this. You must check their key to know whether the JWT can be trusted. How do you do that?


JSON Web Key Sets, or JWKS (how are you pronouncing that?). These provide a standardized way to share the public keys verifying JWTs. While the example above used a simple secret string (“_neonauthorizeiscool_“), key management becomes more complex in production environments with multiple services.


Here’s how it typically works:

1. Your auth provider (like Clerk or Auth0) maintains a set of cryptographic key pairs
2. They sign JWTs using their private keys
3. They publish the corresponding public keys at a JWKS endpoint (usually /.well-known/jwks.json)
4. Your application or service (like Neon) fetches these public keys to verify tokens

A JWKS endpoint returns JSON that looks something like this:


        ```json
        {
          "keys": [
            {
              "kid": "key-identifier-2023",  // Key ID - matches the kid in JWT header
              "kty": "RSA",                  // Key type - usually RSA or EC
              "alg": "RS256",                // Algorithm - like RS256 for RSA SHA-256
              "use": "sig",                  // Usage - 'sig' for signing
              "n": "long-base64-number...",  // RSA public key modulus
              "e": "AQAB"                    // RSA public exponent
            }
          ]
        }
        ```


When your application receives a JWT, it looks at the JWT header to find the kid (key ID), fetches the JWKS from your auth provider, finds the matching public key using the kid, and then uses that key to verify the JWT’s signature.


This system allows for:

- Key rotation: Auth providers can add new keys and retire old ones smoothly
- Multiple keys: Different keys for different purposes or environments
- Trust verification: Everyone knows they’re using the correct keys

For Neon Authorize, you don’t have to manage keys yourself. You just point Neon at your [auth provider’s JWKS endpoint](https://neon.tech/docs/guides/neon-authorize#supported-providers), which handles the verification automatically.


![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/effcaeb0-736a-4d67-81a8-ab23b54a0483/2e9affb2-6726-40e2-9ddb-0e4dae9a0791/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB46623OEUORQ%2F20260517%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260517T150638Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjENr%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIBHgQ%2FhbvmdMzzA0Vr9%2Ba%2BR%2FFtZtUWxb81fF15mY5CtIAiAECSl1o2%2FHYaO8nMAcRT74VMlbljOZZYeR%2BZTSrF0aKCqIBAij%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDYzNzQyMzE4MzgwNSIMOtNsFj3xv3flclEZKtwDwcUHnrzXmfj11AP%2BYjDDyavb4xlZt9A9mvn7wdKhSbo3aObHPzq2m%2F0GwE2sRuzqo095hMvWosrkrL590hixgolvcMTigYmpoPERHy5BQKOe75S2tX%2FHXgO%2FnpdEcaf2jhBkT97kzFiaciB4VWVTVFLGvjAGM45OwMi%2BiI8hnTjXNGfRCJIDFekfKmMn65DeeEhLVdtiljob5t9O9D42MgE2gx4Tb4ycfde9fUBo7C%2FhVgNmgorM4JZcMfecEqX9LEJtcqY9ymtBJj99WHQA6V6MTEx963m1pta90YoD%2F4ESYLdnhcxHyBFLMjyTZF%2B6lSkW%2BLMEKDsNbhdjyEG%2FppGwgDNrK3lG%2BmQxwEAFW7UAt1z1SZflSUkeKeOTGo0ALwhRmoNE6uPiF0HHhwwrB%2BW%2FwKbPJJ%2BY%2F50EzGv8LIrRrRiOZ%2FacHP%2B5FNXkhhEEv1t2icjSUM74vVdoyn2L6RCr8KHi9lQr4dF%2BaN5FYkUfMo%2BAaaMkWW0mz4L1YTQEcp9CjhOAtPOMc5of7gzOhXS41FVnNQSmUcIoEbJL%2BR5hq%2BXrMXEJwgjqfWieIiUlff1fLigYW3Feoxdzg0qV%2Fy9sh6asuqpAQFyJid%2FrrIvwXA5cPZHosPuEqB0wn5ym0AY6pgGqcThvP%2BOhCJivIZgBuMjgQajgrIPgCiF%2Bb48%2Bv1NVKyzej9P24dg%2FbTlwTDtYoQGk0zxBPL%2FBzvgFNG%2Fqnjbv3eA8GMm%2BcsKdHDQ03YEmkAzN88KHVnAdmXpnsssi34CWzTPslEM%2BpfwKuauigB4Jgz7m7zt8OfVw8ZJF%2BKRT3b9ybGgxqs4QTWAJCr5ltqHvdZSJTRol5X%2BOjrcgiZd2XLJzT6%2BR&X-Amz-Signature=2e4f12238d60219581b91719b9ba31c445b41938866e67dc8823e949132f723e&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


The JWT claims in your RLS policies are guaranteed to be legitimate because they’ve been verified using the correct public keys.


### **How JWTs Work in Authorization**


Let’s see how JWTs flow through an authentication and authorization process. Here’s what happens when using Neon Authorize (or any JWT-based system).


First, there is an authentication flow. A user logs in through your auth provider (Clerk, Auth0, etc.). This auth provider verifies credentials and generates a JWT, which is then returned to your application and stored.


Then, you use this JWT in an authorization flow. Your application makes a request to Neon with the JWT included in the Authorization header. Neon verifies the JWT using the JWKS endpoint, and the JWT claims become available for RLS policies.


Let’s say you’re building a multi-tenant application where users should only see their organization’s data.


When a request comes in:

1. Neon extracts the tenant_id from the JWT claims
2. The RLS policy checks if this matches the row’s tenant_id
3. Users only see data from their organization

The beauty of this system is that authorization is enforced at the database level, and there is no need to maintain separate permission tables. Claims can’t be tampered with (thanks to JWT signatures), policies can be as simple or complex as needed, and you can implement a zero-trust model with every request verified.


Remember: your JWTs should contain all the claims needed for authorization decisions, but nothing more. Think of it as a security badge–include the permissions and identifiers required to do the job, but don’t overload it with unnecessary information.


### **Signing vs. Encrypting**


While JWTs are signed, they’re not encrypted by default. It’s important to understand the distinction. **Signing** is about authenticity, proving the token hasn’t been tampered with and comes from a trusted source. **Encryption**, on the other hand, is about privacy–it makes the content unreadable to anyone without the decryption key.


By default, JWTs use signing only. This means:

- ✅ You can verify the token hasn’t been modified
- ✅ You can trust the claims inside the token
- ✅ You can validate the token without a database lookup
- ❌ The contents are not private or secret

You have a few options if you need to send sensitive information. If you want to use regular JWTs, you can store only non-sensitive identifiers in the JWT, then keep sensitive data in your database and use the JWT claims to look it up. Alternatively, you can use encrypted JWTs.


### **JWT FTW**


JWTs have revolutionized how we handle authentication and authorization in modern web applications. They’re elegant in their simplicity: three base64-encoded segments that solve complex distributed authentication challenges. For Neon Authorize users, JWTs are the bridge between your auth provider and your database’s row-level security policies, ensuring users can only access the data they’re supposed to see.


Remember the key points:

- JWTs are self-contained tokens that carry user information and permissions
- They’re signed (but not encrypted) by default
- Your auth provider handles the complex stuff
- Neon uses JWT claims to enforce row-level security

Want to learn more? Check out our posts about using [Neon Authorize](https://neon.tech/docs/guides/neon-authorize) and our [guides](https://neon.tech/docs/guides/neon-authorize-tutorial) for using Neon Authorize with your auth provider.


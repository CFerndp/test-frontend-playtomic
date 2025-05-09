# Technical Task - Frontend

## Getting started

[Create a new repository](https://github.com/new?template_name=technical-test-frontend&template_owner=syltek&visibility=private) using this one as a template. Make sure set the repository visibility to **🔒 Private**.

<details>
<summary>See how</summary>

![](./docs/assets/create-repo-from-template.gif)

</details>

Now clone the repository you just created and run the following commands to install the project dependencies and get a dev-server running:

```
npm install
npm run dev
```

You can also run the project tests using this command:

```
npm test
```

> [!important]
> Some tests will fail if you run them right after cloning the repo; but they **should** be green after you are done with [Task 01](./docs//task-01.md)

Thats it! You are now ready to start with the [tasks](#tasks) or spend some time reading [what's included](#what-is-included-in-the-project) to get familiar with the project.

## Tasks

The test is divided in three mandatory tasks and one optional. The whole test is designed to be resolved in around three hours (not including the optional tasks).

- [x] **1.** Technical work: filling the gaps in the auth flow. [Link](./docs/task-01.md)
- [x] **2.** Product feature request: download all matches. [Link](./docs/task-02.md)
- [x] **3.** Pull Request review: showing correct dates. [Link](./docs/task-03.md)
- [x] **4.** _(optional)_ Technical work: auth refresh flow. [Link](./docs/task-04.md)

### Dos and don'ts

Every task has its own **Dos and Don'ts** section; but there are some things that are shared across all the tasks:

- You **should** commit **frequently** (even more than once per task) using **meaningful commit messages**.
- You **should** document some of the decisions you take while solving the challenge by writing them as a section on this README or as descriptions in the commit messages.
- You **should** consider using the available tooling before including an extra library or implementing your own.
- You **should** be consistent with your code-style.

## What is included in the project?

### Project structure

- `src/lib/`: Our _internal packages_. Each of this directories has an `index` which is considered its **entry-point**; no other part of the codebase should import from any given lib from a file other than the `index`.
- `src/lib/msw`: This a minimal mock server built using [msw](https://mswjs.io/docs). It allows us to simulate a realistic interaction with an API server without having to deploy anything extra. The directory includes a [README](./src/lib/msw/README.md) where you can find every endpoint we have available.
- `src/lib/api`: The data-fetching layer for the project. If you need to _talk_ with the API this is what you should be using. It has a lot of type-related goodies to make your developer experience better.
- `src/lib/api-types`: Some shared type definitions of entities returned by the API. No actual javascript here; just type definitions.
- `src/lib/auth`: Working directory and main focus of [Task 1](./docs/task-01.md).
- `src/views/`: The different views/pages of our application. These are components that take control of the **whole viewport** of the browser.

### Included 3rd-party libraries

- **[material-ui](https://mui.com/material-ui/getting-started/)**: Component library. For simplicity and speed; always try using the available components instead of writing your own implementations.
- **[swr](https://swr.vercel.app/)**: Data-fetching library react-aware.
- **[@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)**: Test framework for UI testing of React components.
- **[vitest](https://vitest.dev/api/)**: Test framework; including assertions and mocking.
- **[msw](https://mswjs.io/docs)**: A mock-server implementation that works on tests and on dev-mode; allowing us to have the same scenario for tests and development!
- **[react-router v5](https://v5.reactrouter.com/web/guides/quick-start)**
- **[react](https://react.dev/reference/react)**
- **[vite](https://vitejs.dev/guide/)**

## Notes about the project solution

### Notes about all the tasks implemented
I decided, as always, to follow this approach:
Implement the solution and then refactor the code so it is more maintainable and readable. You will be able to see this behavior in the commit history of the repository.

### Notes about the 1st task
For this task, there is not much to say: I implemented the solution using a React Context and have some issues with the logic. 
The three possible states of the variables (undefined, null or TokenData) need it from me some time to handle them correctly.

### Notes about the 2nd task
Trying to solve this task, I found different solutions that I tried.

1. Use DataGrid component from Material-ui: Seems like this component has a built-in functionality to export data to CSV, but I was not able to use it because it is not installed as a dependency and a conflict of versions happens if you try to install it. Therefore, I discard it. 
2. Use a more old school trick: generate a CSV in an string and create a BLOB file to download it. This is the one that I decided to use. 

Using this approach, now I have to get all the matches, working with the pagination system of the API. Probably, for this point, there is a better way to do it using useSWRInfinite, but after a couple of tries,  I decided to not use it and implement a simple while loop to get all the matches. This solution is faster and for the purpose of this task, it is enough.

### Notes about the 3rd task

Due to I did some modifications in the code of Matches view for the 2nd task, I had to create the PR manually. 

### Notes about the 4th task
For this, I used a timeout and an effect. Honestly, I am not enough satisfied with that solution and I prefer to check the refresh token in case of error and refresh it if it is valid. 

I did not implement in that way because it will require to refactor a lot and I think is not the scope of this exercise.

#### Token Refresh Timeout Limitation
During testing, I encountered an issue with tokens that have expiration dates set far in the future (several years ahead). This is common in test environments but can cause problems with the refresh mechanism:

- In the tests, tokens with very distant expiration dates caused the `setTimeout` for auto-refresh to be scheduled too far in the future
- This led to potential integer overflow issues with JavaScript's timeout handling
- More importantly, having such long timeouts is impractical and could lead to memory leaks

To solve this issue, I implemented a 24-hour limit for token refresh timeouts in the `getRefreshTimeout` function:

```typescript
// Calculate the time difference in milliseconds
const timeDiff = expiresAt.getTime() - now.getTime()

// Limit to maximum 24 hours (24 * 60 * 60 * 1000 = 86400000 milliseconds)
return Math.min(timeDiff, 86400000)
```

This ensures that even with tokens set to expire years in the future (as is common in test environments), the refresh mechanism will always schedule a check at most 24 hours ahead. This is a practical compromise that works well for both testing and production environments.

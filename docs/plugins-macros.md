> ## Documentation Index
>
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Plugins

> Universal plugin API for extending Bun's runtime and bundler

Bun provides a universal plugin API that can be used to extend both the runtime and bundler.

Plugins intercept imports and perform custom loading logic: reading files, transpiling code, etc. They can be used to add support for additional file types, like `.scss` or `.yaml`. In the context of Bun's bundler, plugins can be used to implement framework-level features like CSS extraction, macros, and client-server code co-location.

## Lifecycle hooks

Plugins can register callbacks to be run at various points in the lifecycle of a bundle:

- `onStart()`: Run once the bundler has started a bundle
- `onResolve()`: Run before a module is resolved
- `onLoad()`: Run before a module is loaded
- `onBeforeParse()`: Run zero-copy native addons in the parser thread before a file is parsed
- `onEnd()`: Run after the bundle is complete

## Reference

A rough overview of the types (please refer to Bun's `bun.d.ts` for the full type definitions):

```ts title="bun.d.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
type PluginBuilder = {
  onStart(callback: () => void): void;
  onResolve: (
    args: { filter: RegExp; namespace?: string },
    callback: (args: { path: string; importer: string }) => {
      path: string;
      namespace?: string;
    } | void,
  ) => void;
  onLoad: (
    args: { filter: RegExp; namespace?: string },
    defer: () => Promise<void>,
    callback: (args: { path: string }) => {
      loader?: Loader;
      contents?: string;
      exports?: Record<string, any>;
    },
  ) => void;
  onEnd(callback: (result: BuildOutput) => void | Promise<void>): void;
  config: BuildConfig;
};

type Loader =
  | 'js'
  | 'jsx'
  | 'ts'
  | 'tsx'
  | 'json'
  | 'jsonc'
  | 'toml'
  | 'yaml'
  | 'file'
  | 'napi'
  | 'wasm'
  | 'text'
  | 'css'
  | 'html';
```

## Usage

A plugin is defined as a JavaScript object containing a `name` property and a `setup` function.

```ts title="myPlugin.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
import type { BunPlugin } from 'bun';

const myPlugin: BunPlugin = {
  name: 'Custom loader',
  setup(build) {
    // implementation
  },
};
```

This plugin can be passed into the `plugins` array when calling `Bun.build`.

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
await Bun.build({
  entrypoints: ['./app.ts'],
  outdir: './out',
  plugins: [myPlugin],
});
```

## Plugin lifecycle

### Namespaces

`onLoad` and `onResolve` accept an optional `namespace` string. What is a namespace?

Every module has a namespace. Namespaces are used to prefix the import in transpiled code; for instance, a loader with a `filter: /\.yaml$/` and `namespace: "yaml:"` will transform an import from `./myfile.yaml` into `yaml:./myfile.yaml`.

The default namespace is `"file"` and it is not necessary to specify it, for instance: `import myModule from "./my-module.ts"` is the same as `import myModule from "file:./my-module.ts"`.

Other common namespaces are:

- `"bun"`: for Bun-specific modules (e.g. `"bun:test"`, `"bun:sqlite"`)
- `"node"`: for Node.js modules (e.g. `"node:fs"`, `"node:path"`)

### onStart

```ts theme={"theme":{"light":"github-light","dark":"dracula"}}
onStart(callback: () => void): Promise<void> | void;
```

Registers a callback to be run when the bundler starts a new bundle.

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { plugin } from 'bun';

plugin({
  name: 'onStart example',

  setup(build) {
    build.onStart(() => {
      console.log('Bundle started!');
    });
  },
});
```

The callback can return a Promise. After the bundle process has initialized, the bundler waits until all `onStart()` callbacks have completed before continuing.

For example:

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
const result = await Bun.build({
  entrypoints: ['./app.ts'],
  outdir: './dist',
  sourcemap: 'external',
  plugins: [
    {
      name: 'Sleep for 10 seconds',
      setup(build) {
        build.onStart(async () => {
          await Bun.sleep(10_000);
        });
      },
    },
    {
      name: 'Log bundle time to a file',
      setup(build) {
        build.onStart(async () => {
          const now = Date.now();
          await Bun.$`echo ${now} > bundle-time.txt`;
        });
      },
    },
  ],
});
```

In the above example, Bun will wait until the first `onStart()` (sleeping for 10 seconds) has completed, as well as the second `onStart()` (writing the bundle time to a file).

<Note>
  `onStart()` callbacks (like every other lifecycle callback) do not have the ability to modify the `build.config`
  object. If you want to mutate `build.config`, you must do so directly in the `setup()` function.
</Note>

### onResolve

```ts theme={"theme":{"light":"github-light","dark":"dracula"}}
onResolve(
  args: { filter: RegExp; namespace?: string },
  callback: (args: { path: string; importer: string }) => {
    path: string;
    namespace?: string;
  } | void,
): void;
```

To bundle your project, Bun walks down the dependency tree of all modules in your project. For each imported module, Bun actually has to find and read that module. The "finding" part is known as "resolving" a module.

The `onResolve()` plugin lifecycle callback allows you to configure how a module is resolved.

The first argument to `onResolve()` is an object with a `filter` and `namespace` property. The `filter` is a regular expression which is run on the import string. Effectively, these allow you to filter which modules your custom resolution logic will apply to.

The second argument to `onResolve()` is a callback which is run for each module import Bun finds that matches the filter and namespace defined in the first argument.

The callback receives as input the path to the matching module. The callback can return a new path for the module. Bun will read the contents of the new path and parse it as a module.

For example, redirecting all imports to `images/` to `./public/images/`:

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { plugin } from 'bun';

plugin({
  name: 'onResolve example',
  setup(build) {
    build.onResolve({ filter: /.*/, namespace: 'file' }, (args) => {
      if (args.path.startsWith('images/')) {
        return {
          path: args.path.replace('images/', './public/images/'),
        };
      }
    });
  },
});
```

### onLoad

```ts theme={"theme":{"light":"github-light","dark":"dracula"}}
onLoad(
  args: { filter: RegExp; namespace?: string },
  defer: () => Promise<void>,
  callback: (args: { path: string, importer: string, namespace: string, kind: ImportKind  }) => {
    loader?: Loader;
    contents?: string;
    exports?: Record<string, any>;
  },
): void;
```

After Bun's bundler has resolved a module, it needs to read the contents of the module and parse it.

The `onLoad()` plugin lifecycle callback allows you to modify the contents of a module before it is read and parsed by Bun.

Like `onResolve()`, the first argument to `onLoad()` allows you to filter which modules this invocation of `onLoad()` will apply to.

The second argument to `onLoad()` is a callback which is run for each matching module before Bun loads the contents of the module into memory.

This callback receives as input the path to the matching module, the importer of the module (the module that imported the module), the namespace of the module, and the kind of the module.

The callback can return a new `contents` string for the module as well as a new `loader`.

For example:

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { plugin } from "bun";

const envPlugin: BunPlugin = {
  name: "env plugin",
  setup(build) {
    build.onLoad({ filter: /env/, namespace: "file" }, args => {
      return {
        contents: `export default ${JSON.stringify(process.env)}`,
        loader: "js",
      };
    });
  },
});

Bun.build({
  entrypoints: ["./app.ts"],
  outdir: "./dist",
  plugins: [envPlugin],
});

// import env from "env"
// env.FOO === "bar"
```

This plugin will transform all imports of the form `import env from "env"` into a JavaScript module that exports the current environment variables.

#### .defer()

One of the arguments passed to the `onLoad` callback is a `defer` function. This function returns a Promise that is resolved when all other modules have been loaded.

This allows you to delay execution of the `onLoad` callback until all other modules have been loaded.

This is useful for returning contents of a module that depends on other modules.

<Accordion title="Example: tracking and reporting unused exports">
  ```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
  import { plugin } from "bun";

plugin({
name: "track imports",
setup(build) {
const transpiler = new Bun.Transpiler();

      let trackedImports: Record<string, number> = {};

      // Each module that goes through this onLoad callback
      // will record its imports in `trackedImports`
      build.onLoad({ filter: /\.ts/ }, async ({ path }) => {
        const contents = await Bun.file(path).arrayBuffer();

        const imports = transpiler.scanImports(contents);

        for (const i of imports) {
          trackedImports[i.path] = (trackedImports[i.path] || 0) + 1;
        }

        return undefined;
      });

      build.onLoad({ filter: /stats\.json/ }, async ({ defer }) => {
        // Wait for all files to be loaded, ensuring
        // that every file goes through the above `onLoad()` function
        // and their imports tracked
        await defer();

        // Emit JSON containing the stats of each import
        return {
          contents: `export default ${JSON.stringify(trackedImports)}`,
          loader: "json",
        };
      });
    },

});

````
</Accordion>

<Warning>
The `.defer()` function currently has the limitation that it can only be called once per `onLoad` callback.
</Warning>

## Native plugins

One of the reasons why Bun's bundler is so fast is that it is written in native code and leverages multi-threading to load and parse modules in parallel.

However, one limitation of plugins written in JavaScript is that JavaScript itself is single-threaded.

Native plugins are written as NAPI modules and can be run on multiple threads. This allows native plugins to run much faster than JavaScript plugins.

In addition, native plugins can skip unnecessary work such as the UTF-8 -> UTF-16 conversion needed to pass strings to JavaScript.

These are the following lifecycle hooks which are available to native plugins:

* `onBeforeParse()`: Called on any thread before a file is parsed by Bun's bundler.

Native plugins are NAPI modules which expose lifecycle hooks as C ABI functions.

To create a native plugin, you must export a C ABI function which matches the signature of the native lifecycle hook you want to implement.

### Creating a native plugin in Rust

Native plugins are NAPI modules which expose lifecycle hooks as C ABI functions.

To create a native plugin, you must export a C ABI function which matches the signature of the native lifecycle hook you want to implement.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun add -g @napi-rs/cli
napi new
````

Then install this crate:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
cargo add bun-native-plugin
```

Now, inside the `lib.rs` file, we'll use the `bun_native_plugin::bun` proc macro to define a function which will implement our native plugin.

Here's an example implementing the `onBeforeParse` hook:

```rust title="lib.rs" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/rust.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=c48e2f9ffc38d0c1d77ef723c617aca8" theme={"theme":{"light":"github-light","dark":"dracula"}}
use bun_native_plugin::{define_bun_plugin, OnBeforeParse, bun, Result, anyhow, BunLoader};
use napi_derive::napi;

/// Define the plugin and its name
define_bun_plugin!("replace-foo-with-bar");

/// Here we'll implement `onBeforeParse` with code that replaces all occurrences of
/// `foo` with `bar`.
///
/// We use the #[bun] macro to generate some of the boilerplate code.
///
/// The argument of the function (`handle: &mut OnBeforeParse`) tells
/// the macro that this function implements the `onBeforeParse` hook.
#[bun]
pub fn replace_foo_with_bar(handle: &mut OnBeforeParse) -> Result<()> {
  // Fetch the input source code.
  let input_source_code = handle.input_source_code()?;

  // Get the Loader for the file
  let loader = handle.output_loader();

  let output_source_code = input_source_code.replace("foo", "bar");

  handle.set_output_source_code(output_source_code, BunLoader::BUN_LOADER_JSX);

  Ok(())
}
```

And to use it in `Bun.build()`:

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
import myNativeAddon from './my-native-addon';

Bun.build({
  entrypoints: ['./app.tsx'],
  plugins: [
    {
      name: 'my-plugin',

      setup(build) {
        build.onBeforeParse(
          {
            namespace: 'file',
            filter: '**/*.tsx',
          },
          {
            napiModule: myNativeAddon,
            symbol: 'replace_foo_with_bar',
            // external: myNativeAddon.getSharedState()
          },
        );
      },
    },
  ],
});
```

### onBeforeParse

```ts theme={"theme":{"light":"github-light","dark":"dracula"}}
onBeforeParse(
  args: { filter: RegExp; namespace?: string },
  callback: { napiModule: NapiModule; symbol: string; external?: unknown },
): void;
```

This lifecycle callback is run immediately before a file is parsed by Bun's bundler.

As input, it receives the file's contents and can optionally return new source code.

<Info>This callback can be called from any thread and so the napi module implementation must be thread-safe.</Info>

### onEnd

```ts theme={"theme":{"light":"github-light","dark":"dracula"}}
onEnd(callback: (result: BuildOutput) => void | Promise<void>): void;
```

Registers a callback to be run after the bundle is complete. The callback receives the [`BuildOutput`](/docs/bundler#outputs) object containing the build results, including output files and any build messages.

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
const result = await Bun.build({
  entrypoints: ['./app.ts'],
  outdir: './dist',
  plugins: [
    {
      name: 'onEnd example',
      setup(build) {
        build.onEnd((result) => {
          console.log(`Build completed with ${result.outputs.length} files`);
          for (const log of result.logs) {
            console.log(log);
          }
        });
      },
    },
  ],
});
```

The callback can return a `Promise`. The build output promise from `Bun.build()` will not resolve until all `onEnd()` callbacks have completed.

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
const result = await Bun.build({
  entrypoints: ['./app.ts'],
  outdir: './dist',
  plugins: [
    {
      name: 'Upload to S3',
      setup(build) {
        build.onEnd(async (result) => {
          if (!result.success) return;
          for (const output of result.outputs) {
            await uploadToS3(output);
          }
        });
      },
    },
  ],
});
```

Built with [Mintlify](https://mintlify.com).

> ## Documentation Index
>
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Macros

> Run JavaScript functions at bundle-time with Bun macros

Macros are a mechanism for running JavaScript functions at bundle-time. The value returned from these functions are directly inlined into your bundle.

As a toy example, consider this simple function that returns a random number.

```ts title="random.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
export function random() {
  return Math.random();
}
```

This is a regular function in a regular file, but you can use it as a macro like so:

```tsx title="cli.tsx" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { random } from './random.ts' with { type: 'macro' };

console.log(`Your random number is ${random()}`);
```

<Note>
  Macros are indicated using import attribute syntax. If you haven't seen this syntax before, it's a Stage 3 TC39
  proposal that lets you attach additional metadata to import statements.
</Note>

Now we'll bundle this file with `bun build`. The bundled file will be printed to stdout.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun build ./cli.tsx
```

```js theme={"theme":{"light":"github-light","dark":"dracula"}}
console.log(`Your random number is ${0.6805550949689833}`);
```

As you can see, the source code of the `random` function occurs nowhere in the bundle. Instead, it is executed during bundling and function call (`random()`) is replaced with the result of the function. Since the source code will never be included in the bundle, macros can safely perform privileged operations like reading from a database.

## When to use macros

If you have several build scripts for small things where you would otherwise have a one-off build script, bundle-time code execution can be easier to maintain. It lives with the rest of your code, it runs with the rest of the build, it is automatically parallelized, and if it fails, the build fails too.

If you find yourself running a lot of code at bundle-time though, consider running a server instead.

## Import attributes

Bun Macros are import statements annotated using either:

- `with { type: 'macro' }` — an import attribute, a Stage 3 ECMA Script proposal
- `assert { type: 'macro' }` — an import assertion, an earlier incarnation of import attributes that has now been abandoned (but is already supported by a number of browsers and runtimes)

## Security considerations

Macros must explicitly be imported with `{ type: "macro" }` in order to be executed at bundle-time. These imports have no effect if they are not called, unlike regular JavaScript imports which may have side effects.

You can disable macros entirely by passing the `--no-macros` flag to Bun. It produces a build error like this:

```
error: Macros are disabled

foo();
^
./hello.js:3:1 53
```

To reduce the potential attack surface for malicious packages, macros cannot be invoked from inside `node_modules/**/*`. If a package attempts to invoke a macro, you'll see an error like this:

```
error: For security reasons, macros cannot be run from node_modules.

beEvil();
^
node_modules/evil/index.js:3:1 50
```

Your application code can still import macros from `node_modules` and invoke them.

```ts title="cli.tsx" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { macro } from 'some-package' with { type: 'macro' };

macro();
```

## Export condition "macro"

When shipping a library containing a macro to npm or another package registry, use the `"macro"` export condition to provide a special version of your package exclusively for the macro environment.

```json title="package.json" icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "my-package",
  "exports": {
    "import": "./index.js",
    "require": "./index.js",
    "default": "./index.js",
    "macro": "./index.macro.js"
  }
}
```

With this configuration, users can consume your package at runtime or at bundle-time using the same import specifier:

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
import pkg from 'my-package'; // runtime import
import { macro } from 'my-package' with { type: 'macro' }; // macro import
```

The first import will resolve to `./node_modules/my-package/index.js`, while the second will be resolved by Bun's bundler to `./node_modules/my-package/index.macro.js`.

## Execution

When Bun's transpiler sees a macro import, it calls the function inside the transpiler using Bun's JavaScript runtime and converts the return value from JavaScript into an AST node. These JavaScript functions are called at bundle-time, not runtime.

Macros are executed synchronously in the transpiler during the visiting phase—before plugins and before the transpiler generates the AST. They are executed in the order they are imported. The transpiler will wait for the macro to finish executing before continuing. The transpiler will also await any Promise returned by a macro.

Bun's bundler is multi-threaded. As such, macros execute in parallel inside of multiple spawned JavaScript "workers".

## Dead code elimination

The bundler performs dead code elimination after running and inlining macros. So given the following macro:

```ts title="returnFalse.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
export function returnFalse() {
  return false;
}
```

...then bundling the following file will produce an empty bundle, provided that the minify syntax option is enabled.

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { returnFalse } from './returnFalse.ts' with { type: 'macro' };

if (returnFalse()) {
  console.log('This code is eliminated');
}
```

## Serializability

Bun's transpiler needs to be able to serialize the result of the macro so it can be inlined into the AST. All JSON-compatible data structures are supported:

```ts title="macro.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
export function getObject() {
  return {
    foo: 'bar',
    baz: 123,
    array: [1, 2, { nested: 'value' }],
  };
}
```

Macros can be async, or return Promise instances. Bun's transpiler will automatically await the Promise and inline the result.

```ts title="macro.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
export async function getText() {
  return 'async value';
}
```

The transpiler implements special logic for serializing common data formats like `Response`, `Blob`, `TypedArray`.

- **TypedArray**: Resolves to a base64-encoded string.
- **Response**: Bun will read the `Content-Type` and serialize accordingly; for instance, a Response with type `application/json` will be automatically parsed into an object and `text/plain` will be inlined as a string. Responses with an unrecognized or undefined type will be base-64 encoded.
- **Blob**: As with Response, the serialization depends on the `type` property.

The result of `fetch` is `Promise<Response>`, so it can be directly returned.

```ts title="macro.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
export function getObject() {
  return fetch('https://bun.com');
}
```

Functions and instances of most classes (except those mentioned above) are not serializable.

```ts title="macro.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
export function getText(url: string) {
  // this doesn't work!
  return () => {};
}
```

## Arguments

Macros can accept inputs, but only in limited cases. The value must be statically known. For example, the following is not allowed:

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { getText } from './getText.ts' with { type: 'macro' };

export function howLong() {
  // the value of `foo` cannot be statically known
  const foo = Math.random() ? 'foo' : 'bar';

  const text = getText(`https://example.com/${foo}`);
  console.log('The page is ', text.length, ' characters long');
}
```

However, if the value of `foo` is known at bundle-time (say, if it's a constant or the result of another macro) then it's allowed:

```ts title="index.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { getText } from './getText.ts' with { type: 'macro' };
import { getFoo } from './getFoo.ts' with { type: 'macro' };

export function howLong() {
  // this works because getFoo() is statically known
  const foo = getFoo();
  const text = getText(`https://example.com/${foo}`);
  console.log('The page is', text.length, 'characters long');
}
```

This outputs:

```js theme={"theme":{"light":"github-light","dark":"dracula"}}
function howLong() {
  console.log('The page is', 1322, 'characters long');
}
export { howLong };
```

## Examples

### Embed latest git commit hash

```ts title="getGitCommitHash.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
export function getGitCommitHash() {
  const { stdout } = Bun.spawnSync({
    cmd: ['git', 'rev-parse', 'HEAD'],
    stdout: 'pipe',
  });

  return stdout.toString();
}
```

When we build it, the `getGitCommitHash` is replaced with the result of calling the function:

<CodeGroup>
  ```ts input theme={"theme":{"light":"github-light","dark":"dracula"}}
  import { getGitCommitHash } from "./getGitCommitHash.ts" with { type: "macro" };

console.log(`The current Git commit hash is ${getGitCommitHash()}`);

````

```ts output theme={"theme":{"light":"github-light","dark":"dracula"}}
console.log(`The current Git commit hash is 3ee3259104e4507cf62c160f0ff5357ec4c7a7f8`);
````

</CodeGroup>

<Info>
  You're probably thinking "Why not just use `process.env.GIT_COMMIT_HASH`?" Well, you can do that too. But can you do
  this with an environment variable?
</Info>

### Make fetch() requests at bundle-time

In this example, we make an outgoing HTTP request using `fetch()`, parse the HTML response using `HTMLRewriter`, and return an object containing the title and meta tags–all at bundle-time.

```ts title="meta.ts" icon="https://mintcdn.com/bun-1dd33a4e/JUhaF6Mf68z_zHyy/icons/typescript.svg?fit=max&auto=format&n=JUhaF6Mf68z_zHyy&q=85&s=7ac549adaea8d5487d8fbd58cc3ea35b" theme={"theme":{"light":"github-light","dark":"dracula"}}
export async function extractMetaTags(url: string) {
  const response = await fetch(url);
  const meta = {
    title: '',
  };
  new HTMLRewriter()
    .on('title', {
      text(element) {
        meta.title += element.text;
      },
    })
    .on('meta', {
      element(element) {
        const name =
          element.getAttribute('name') ||
          element.getAttribute('property') ||
          element.getAttribute('itemprop');

        if (name) meta[name] = element.getAttribute('content');
      },
    })
    .transform(response);

  return meta;
}
```

The `extractMetaTags` function is erased at bundle-time and replaced with the result of the function call. This means that the fetch request happens at bundle-time, and the result is embedded in the bundle. Also, the branch throwing the error is eliminated since it's unreachable.

<CodeGroup>
  ```jsx input theme={"theme":{"light":"github-light","dark":"dracula"}}
  import { extractMetaTags } from "./meta.ts" with { type: "macro" };

export const Head = () => {
const headTags = extractMetaTags("https://example.com");

    if (headTags.title !== "Example Domain") {
      throw new Error("Expected title to be 'Example Domain'");
    }

    return (
      <head>
        <title>{headTags.title}</title>
        <meta name="viewport" content={headTags.viewport} />
      </head>
    );

};

````

```jsx output theme={"theme":{"light":"github-light","dark":"dracula"}}
export const Head = () => {
  const headTags = {
    title: "Example Domain",
    viewport: "width=device-width, initial-scale=1",
  };

  return (
    <head>
      <title>{headTags.title}</title>
      <meta name="viewport" content={headTags.viewport} />
    </head>
  );
};
````

</CodeGroup>

Built with [Mintlify](https://mintlify.com).

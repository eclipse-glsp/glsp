# Eclipse GLSP - Shared Typescript configuration

Common shared configuration for Eclipse GLSP components that are based on Typescript.

## Install

```bash
yarn add --dev @eclipse-glsp/ts-config
```

## Usage

**Create a `tsconfig.json`**:

```json
{
    "extends": "@eclipse-glsp/ts-config/tsconfig.json",
    "compilerOptions": {
        "rootDir": "src",
        "outDir": "lib"
    }
}
```

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).

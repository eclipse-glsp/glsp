# glsp-core: combined changelog

`glsp-core` keeps one changelog for several components: each release section has a `### <Component>` group per component, each with its own `#### Changes` and `#### Potentially Breaking Changes`.

Entries below the "predate the consolidation" disclaimer belong to the former `glsp-client`, `glsp-server-node` and `glsp` repositories. Leave them and their links exactly as they are (the protocol was part of `glsp-client` back then, so those sections record protocol changes under Client).

## Components (Step 1.2)

Decide the component of each PR with an entry from the files it touched (`gh pr view <n> --repo eclipse-glsp/glsp-core --json files --jq '.files[].path'`):

| Changed paths | Component |
| --- | --- |
| `packages/common/**` | **Protocol** |
| `packages/client/**`, `examples/workflow-glsp/**`, `examples/workflow-standalone/**` | **Client** |
| `packages/server/**`, `examples/workflow-server*/**` | **Server** |
| `dev-packages/**` | **Dev Packages** |
| `e2e/**` | **E2E** |

- A PR that touches several components gets one entry per component, each describing that component's part (same PR link).
- A PR that only touches repository-wide files (root configs, `.github/**`, docs) has no natural component: flag it, unless it clearly applies everywhere (a Node version bump goes into every component, like earlier `[node]` entries).
- Pick the tag from those used within the component: `[diagram]`, `[routing]` are client tags, `[gmodel]`, `[operation]`, `[layout]` server tags, `[cli]`, `[eslint-config]`, `[ts-config]` dev-package tags. Older `[protocol]` entries under Client predate the Protocol component; inside `### Protocol` use finer tags (`[action]`, `[di]`, `[uuid]`).

## Sections (Phase 2)

Instead of the generic template, create a new active section directly below the intro line, above the disclaimer and `---` block, with every component in this order, and keep all of them while the section is active so contributors have a place to add entries (empty headings are dropped when the release is finalized):

```markdown
## v2.8.0 - active

### Protocol

#### Changes

#### Potentially Breaking Changes

### Client

#### Changes

#### Potentially Breaking Changes

### Server

#### Changes

#### Potentially Breaking Changes

### Dev Packages

#### Changes

#### Potentially Breaking Changes

### E2E

#### Changes

#### Potentially Breaking Changes
```

Add each entry under its component's `#### Changes` or `#### Potentially Breaking Changes`.

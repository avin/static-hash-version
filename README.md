# Static-hash-version

Adds a prefix to links to statics containing the hash of the specified local files.

Before:

```html
<script src="assets/script.js"></script>
```

After (with hash version prefix):

```html
<script src="assets/script.js?v=d1f7cc0bd0"></script>
```

After (with integrity attribute):

```html
<script
  src="assets/script.js"
  integrity="sha384-JEnTFJ+xD2h3lK6x+XlNmwfcn1hXQ0Ocp9IznvK/daQZ6OiHpYYu+r5yR0bCmug8"
  crossorigin="anonymous"
></script>
```

## Usage

Install:

```sh
npm install static-hash-version
```

Simple usage:

```js
const staticHashVersion = require("static-hash-version");

const result = staticHashVersion({
  htmlFilePath: "./static/index.html",
});

console.log(result);
```

Complex usage:

```js
const staticHashVersion = require("static-hash-version");

staticHashVersion({
  htmlFilePath: "./static/index.html",
  writeToFile: true,
  tags: [
    {
      tagSelector: "script",
      fileAttr: "src",
      withIntegrity: false,
      withVersion: true,
    },
    {
      tagSelector: 'link[rel="stylesheet"]',
      fileAttr: "href",
      withIntegrity: false,
      withVersion: true,
    },
  ],
  onFileAbsence: (filePath) => {
    console.warn(`File ${filePath} is absent`);
  },
});
```

## Options

### htmlFilePath

- Required: **yes**
- Type: `string`
- Default value:
- Description: File path for processing html file

### writeToFile

- Required: no
- Type: `boolean`
- Default value: `false`
- Description: Write result to processing html file

### onFileAbsence

- Required: no
- Type: `(filePath: string) => void`
- Default value: `(v: string) => {}`
- Description: Function called when the file specified in the tag is not found on disk

### tags

- Required: no
- Type:

  ```js
  {
    tagSelector: string;
    fileAttr: string;
    withIntegrity: boolean;
    withVersion: boolean;
  }
  [];
  ```

- Default value:

  ```js
  [
    {
      tagSelector: "script",
      fileAttr: "src",
      withIntegrity: false,
      withVersion: true,
    },
    {
      tagSelector: 'link[rel="stylesheet"]',
      fileAttr: "href",
      withIntegrity: false,
      withVersion: true,
    },
  ];
  ```

- Description: Processing tags

#### Tags item options

##### tagSelector

- Type: `string`
- Description: Selector for tag

##### fileAttr

- Type: `string`
- Description: Tag attribute containing a link to the file

##### withIntegrity

- Type: `boolean`
- Description: Add integrity-attribute

##### withVersion

- Type: `boolean`
- Description: Add hash suffix for file path `?v=XXXXX`

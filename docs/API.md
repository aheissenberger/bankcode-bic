# API Documentation

## Data Serialization Types

The library supports three data serialization types for packed bank data:

| Type         | When Used (Rule)        | Structure Description                                                             |
| ------------ | ----------------------- | --------------------------------------------------------------------------------- |
| `flat`       | `keyNames.length === 0` | Array of rows, each row is an array of field values.                              |
| `keyed`      | `keyNames.length === 1` | Object keyed by the field value, value is a string or array of field values.      |
| `serialized` | `keyNames.length >= 2`  | Object with a `keys` map for each key, and a `banks` array of field value arrays. |

Each type tries is optimized for a small footprint an fast access without reprocessing to create the hash table for the keys. The type is based on the rules used when generation the datasets.

**Size for only BankCode to BIC conversion including [keyedGetObject function](#keyedgetobject) for easy query the data:**

| Country      | Size     | gzip     |
| ------------ | -------- | -------- |
| Austria (AT) | 17.50 kB | 4.43 kB  |
| Germany (DE) | 70.83 kB | 21.49 kB |

### Example: flat

Created when no keyNames are provided (e.g., `keyNames = []`).

```js
{
  type: 'flat',
  fields: ['BankCode', 'BIC', 'Name'],
  banks: [
    ['10000000', 'MARKDEF1100',  'Bundesbank'],
    ['10010300', 'KLRNDEBEXXX',  'Klarna Bank German Branch'],
    // ...
  ]
}
```

### Example: keyed

Created when exactly one keyName is provided (e.g., `keyNames = ['BIC']`).
Use [keyedGetObject function](#keyedgetobject) to retrieve results.

```js
{
  type: 'keyed',
  key: 'BankCode',
  fields: ['BIC', 'Name'],
  banks: {
    10000000: ['MARKDEF1100',  'Bundesbank'],
    10010300: ['KLRNDEBEXXX',  'Klarna Bank German Branch'],
    // ...
  }
}
```

**Variation:** If there is only on Field the array is replaced by the value. When retrieving this is handled by the [toObject function](#toobject).

```js
{
  type: 'keyed',
  key: 'BankCode',
  fields: ['BIC'],
  banks: {
    10000000: 'MARKDEF1100',
    10010300: 'KLRNDEBEXXX',
    // ...
  }
}
```

### Example: serialized

Created when two or more keyNames are provided (e.g., `keyNames = ['BIC', 'BankCode']`).
The keys contain the row index with the full data set.
Use [serializedGetObject function](#serializedgetobject) to retriev results.

```js
{
  type: 'serialized',
  keys: {
    BIC: { MARKDEF1100: 0, KLRNDEBEXXX: 1 },
    BankCode: { '10000000': 0, '10010300': 1 }
  },
  fields: ['BankCode', 'BIC', 'Name'],
  banks: [
    ['10000000', 'MARKDEF1100',  'Bundesbank'],
    ['10010300', 'KLRNDEBEXXX',  'Klarna Bank German Branch'],
    // ...
  ]
}
```

Use []

## Query

### keyedGetObject

Retrieves an object from keyed data based on a key value.

**Signature:**

```ts
keyedGetObject(keyValue: string, data: DataResultKeyed): Record<FieldNameType, string> | undefined
```

| Parameter  | Type              | Description                                              |
| ---------- | ----------------- | -------------------------------------------------------- |
| `keyValue` | `string`          | The value of the key to look up.                         |
| `data`     | `DataResultKeyed` | The keyed data result (must be of type DataResultKeyed). |

| Returns | Type                                         | Description                                                           |
| ------- | -------------------------------------------- | --------------------------------------------------------------------- |
|         | `Record<FieldNameType, string> \| undefined` | The object corresponding to the key value, or undefined if not found. |

| Throws  | Description                         |
| ------- | ----------------------------------- |
| `Error` | If the data is not in keyed format. |

---

### serializedGetObject

Retrieves an object from serialized data based on a key and key value.

**Signature:**

```ts
serializedGetObject(key: string, keyValue: string, data: DataResult): Record<FieldNameType, string> | undefined
```

| Parameter  | Type         | Description                                                        |
| ---------- | ------------ | ------------------------------------------------------------------ |
| `key`      | `string`     | The field name of the key to look up.                              |
| `keyValue` | `string`     | The value of the key to look up.                                   |
| `data`     | `DataResult` | The serialized data result (must be of type DataResultSerialized). |

| Returns | Type                                         | Description                                                           |
| ------- | -------------------------------------------- | --------------------------------------------------------------------- |
|         | `Record<FieldNameType, string> \| undefined` | The object corresponding to the key value, or undefined if not found. |

| Throws  | Description                                                      |
| ------- | ---------------------------------------------------------------- |
| `Error` | If the data is not in serialized format or the key is not found. |

---

### toObject

Converts field values to an object with the specified fields.

**Signature:**

```ts
toObject(fieldValues: string | string[], fields: FieldNameType[]): Record<FieldNameType, string>
```

| Parameter     | Type                 | Description                                                          |
| ------------- | -------------------- | -------------------------------------------------------------------- |
| `fieldValues` | `string \| string[]` | The values of the fields, either as a string or an array of strings. |
| `fields`      | `FieldNameType[]`    | The field names to use as keys in the resulting object.              |

| Returns | Type                            | Description                                                                                                     |
| ------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
|         | `Record<FieldNameType, string>` | An object where each key corresponds to a field name and its value is the corresponding value from fieldValues. |

## Fetch Data

### fetchData

Fetches bank data for a specified country and packs it into a structured format.

**Signature:**

```ts
fetchData(country: string, options: fetchDataOptions): Promise<PackedData>
```

| Parameter | Type               | Description                                                                        |
| --------- | ------------------ | ---------------------------------------------------------------------------------- |
| `country` | `string`           | The country code for which to fetch bank data.                                     |
| `options` | `fetchDataOptions` | Optional parameters including key names, field names, and a custom fetch function. |

| Returns | Type                  | Description                                                                  |
| ------- | --------------------- | ---------------------------------------------------------------------------- |
|         | `Promise<PackedData>` | A promise that resolves to a packed data object containing bank information. |

| Throws  | Description                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------- |
| `Error` | If the download URL is not found, if the data fails to download, if parsing fails, or if packing fails. |

---

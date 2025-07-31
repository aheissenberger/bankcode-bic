# bankcode-bic

Convert bank codes to BICs and vice versa. Currently supports only banks from the following countries: AT, BE, DE, ES, FR ([see adding support for other countries](#contributing))
This libray is an extention to exiting IBAN libraries which can extract the ISO CountryCode and BankCode from an IBAN but cannot provide the BIC, Name and Address of the Bank.

This library will fetch the list from each country's national bank website. The [function to fetch](./docs/API.md#fetchdata) and the specific implementations per country do not depend on any JavaScript environment which allows to implement this on edge functions in the cloud.

To convert from IBAN to BIC use one of the many IBAN libraries e.g. [ibankit-js](https://github.com/koblas/ibankit-js) to retrive the BankCode from the IBAN.

## Installation

install from npm:

`npm i bankcode-bic # or yarn bankcode-bic, or pnpm add bankcode-bic`

## Usage

### API

For more details check out the full [API Docs](./docs/API.md).

### Example Implementation

This is a example nodejs cli app which uses the generated data.

1. generate the data which will create the file `./output/de.js`
   `npm run bankcode-bic generate --filter-countries de ./output --key-names BankCode --field-names BIC`

2. import the file `./output/de.js` into your application

```js
import process from 'node:process'
import { keyedGetObject } from 'bankcode-bic'
import { bankData } from './output/de.js'
const bankCode = process.argv[2]
console.log(keyedGetObject(bankCode, bankData))
```

3. bundle your application

### Command Line

```
Usage: bankcode-bic [options] <command>

Commands:
  download <file>      Download the original CSV source BIC and bank address data to a file
  generate <directory>      Generate a custom import files with relevant data in the specified directory
  help                 Show this help message

  lookup <file> <keyName> <keyValue>   Find the <keyName> with the <keyValue> in the specified <file>.
                                       You need to create a '<filename>.js' with the 'generate' command.
                                       Example: bankcode-bic lookup de.js BankCode 305156796

Global Options:
  --filter-countries <country>  Filter results by country code (e.g., DE, LT)
  --clear-cache        Clear the cache before downloading data
  --debug              Enable debug output
  --no-cache           Disable caching of downloaded data
  --cache-ttl <ms>     Set cache TTL in milliseconds (default: 24 hours)
  --quiet             Suppress output messages
  -h, --help           Show help

only for 'generate' command:
  --field-names <fields>  Comma-separated list of field names to include in the generated file
  --key-names <keys>      Comma-separated list of key names to include in the generated file
  --format <json|js|ts>   Output format used by generate command (default: '.js')


Examples:
  generate bankcode-bic-data.js --filter-countries DE,LT
  bankcode-bic lookup bankcode LT 305156796 --import-bank-db bankcode-bic-data.js

```

#### Examples

**generate:** create a dataset with search keys BankCode, BIC and the fields BankCode, BIC, Name.

```sh
$ bankcode-bic % pnpm bankcode-bic generate --filter-countries de ./output --key-names BankCode --key-names BIC --field-names BankCode --field-names BIC --field-names Name
Download URL (cached): https://www.bundesbank.de/resource/blob/926192/bdb8c7e624fa55dd552f73312f6a44db/472B63F073F071307366337C94F8C870/blz-aktuell-csv-data.csv
Fetched data (cached) Size: 1900725 bytes
Parsed data (cached) Size: 3080 rows

Saved dataset for 'de' size 280718 bytes, format 'serialized' to:
output/de.js
```

**lookup:** get BIC, Name of Bank of a german Bank with ISO Country Code `DE` and BankCode `10011001`

```sh
$ bankcode-bic % pnpm bankcode-bic lookup output/de.js BankCode 10011001
Using imported bank data from: output/de.js
Data type: keyed, rows: 3080
BankCode === 10011001
{"BIC":"NTSBDEB1XXX","name":"N26 Bank"}
```

## Configuration

### Cache Directory

**Node:**
Type: files system
Default: `./cache`
Environment Variable `CACHE_DIR`

**Browser:**
Type: local storage
Key: `localcache-meta`

## Datasets

| Country      | Source Website                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Austria (AT) | [Österreichische Nationalbank Bankstellenverzeichnis](https://www.oenb.at/en/Statistics/Reporting-Systems/Bank-identifier-code.html)                     |
| Belgium (BE) | [National Bank of Belgium Bank Identification Codes](https://www.nbb.be/en/financial-oversight/bank-identification-codes)                                |
| Germany (DE) | [Deutsche Bundesbank Bankleitzahlendatei](https://www.bundesbank.de/en/tasks/payment-systems/bank-sort-codes)                                            |
| Spain (ES)   | [European Central Bank Financial Institutions](https://www.ecb.europa.eu/stats/financial_corporations/list_of_financial_institutions/html/index.en.html) |
| France (FR)  | [European Central Bank Financial Institutions](https://www.ecb.europa.eu/stats/financial_corporations/list_of_financial_institutions/html/index.en.html) |

## Development

- Install dependencies:

```bash
npm install
```

- Run the unit tests:

```bash
npm run test
```

- Build the library:

```bash
npm run build
```

## Know How

Here's a clear and concise overview of **IBAN**, **BIC**, and **RIAD**, along with a table that shows how they relate to each other:

---

### 📘 Table 1: Overview of IBAN, BIC, RIAD

| Code     | Full Name                                             | Purpose                                                       | Who Uses It                 | Publicly Available | Example                       |
| -------- | ----------------------------------------------------- | ------------------------------------------------------------- | --------------------------- | ------------------ | ----------------------------- |
| **IBAN** | International Bank Account Number                     | Identifies individual bank accounts for cross-border payments | Customers, banks            | ✅ Yes             | `DE89 3704 0044 0532 0130 00` |
| **BIC**  | Bank Identifier Code (SWIFT)                          | Identifies a specific bank in international transactions      | Banks, SWIFT network        | ✅ Yes             | `BANKDEFFXXX`                 |
| **RIAD** | Register of Institutions and Affiliates Database code | Internal regulatory identifier for financial institutions     | ECB, national central banks | ❌ No              | `ECB123456` (fictional)       |

---

### 🔗 Table 2: Relationships Between IBAN, BIC, and RIAD

| From | Can Derive | How                                                                               |
| ---- | ---------- | --------------------------------------------------------------------------------- |
| IBAN | → BIC      | Bank code inside IBAN maps to a BIC via national directory (e.g., BLZ in Germany) |
| BIC  | → RIAD     | Central banks use BIC to locate the RIAD code in internal systems                 |
| IBAN | → RIAD     | ❌ Not directly; only via BIC and central bank mapping                            |

## Contributing

Contributions are welcome! If you want to add support for more countries, improve the code, or fix bugs, please follow these steps:

1. Fork the repository and create a new branch for your feature or fix.
2. Make your changes and add or update tests as needed.
3. Run `pnpm test` to ensure all tests pass.
4. Open a pull request with a clear description of your changes and the motivation behind them.

For major changes or questions, please open an issue first to discuss what you would like to change.

To add a country start with copying an existing implementation in `./src/download`.
Read [Copilot Instructions](./github/copilot-instructions.md) for an overview of the repository.

Thank you for helping make this project better!

## Publish to NPM

run this command and choose the type (major, minor, patch) of release
`pnpm release`

## TODO

[ ] add more countries
[ ] use the address data from European Central Bank to enhance datasets with missing address information

## Credits

- [iban-to-bic](https://github.com/sigalor/iban-to-bic)

## License

[MIT](./LICENSE) License © 2025 [Andreas Heissenberger](https://github.com/aheissenberger)

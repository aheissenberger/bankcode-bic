export function showHelp(cmd: string): void {
  if (cmd === 'lookup') {
    console.info(`Usage: bankcode-bic lookup <file> <keyName> <keyValue>

Find the <keyName> with the <keyValue> in the specified <file>.
You need to create a '<filename>.js' with the 'generate' command.
Example: bankcode-bic lookup de.js BankCode 305156796
`)
  } else {
    console.info(`
Usage: bankcode-bic [options] <command>

Commands:
  download <file>      Download the original CSV source BIC and bank address data to a file
  generate <directory>      Generate a custom import files with relevant data in the specified directory
  help                 Show this help message

  lookup <file> <keyName> <keyValue>   Find the <keyName> with the <keyValue> in the specified <file>. 
                                       You need to create a '<filename>.js' with the 'generate' command.
                                       Example: bankcode-bic lookup de.js BankCode 305156796

Global Options:
  --filter-country <country>  Filter results by country code (e.g., DE, LT)
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
  generate bankcode-bic-data.js --filter-country DE,LT
  bankcode-bic lookup bankcode LT 305156796 --import-bank-db bankcode-bic-data.js

For more information, visit: https://github.com/aheissenberger/bankcode-bic
`)
  }
}

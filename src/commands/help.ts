export function showHelp(cmd?: string): void {
  if (cmd === 'lookup') {
    console.info(`Usage: bankcode-bic lookup <file> <keyName> <keyValue>
      --quiet             Suppress output messages

Find the <keyName> with the <keyValue> in the specified <file>.
You need to create a '<filename>.js' with the 'generate' command.
Example: bankcode-bic lookup ./output/de.js BankCode 10010010
`)
  } else if (cmd === 'download') {
    console.info(`Usage: bankcode-bic download <file>

Download the original CSV source BIC and bank address data to a file.
Example: bankcode-bic download ./output/de.csv
`)
  } else if (cmd === 'generate') {
    console.info(`Usage: bankcode-bic generate <directory>
  --countries <country>     Create datasets for countries (e.g., DE, LT)
  --field-names <fields>    Comma-separated list of field names to include in the generated file
  --key-names <keys>        Comma-separated list of key names to include in the generated file
  --format <json|js|ts>     Output format used by generate command (default: '.js')
  --clear-cache             Clear the cache before downloading data
  --debug                   Enable debug output
  --no-cache                Disable caching of downloaded data
  --cache-ttl <ms>          Set cache TTL in milliseconds (default: 24 hours)

Generate a custom import files with relevant data in the specified directory.
Example: bankcode-bic generate ./output --field-names bic,name --key-names bankcode --countries DE,LT
`)
  } else {
    console.info(`
Usage: bankcode-bic [options] <command>

Commands:
  download <file>           Download the original CSV source BIC and bank address data to a file
  generate <directory>      Generate a custom import files with relevant data in the specified directory
  lookup <file> <keyName> <keyValue>   Find the <keyName> with the <keyValue> in the specified <file>. 
                                       You need to create a '<filename>.js' with the 'generate' command.
  help                      Show this help message

Global Options:
  --countries <country>     Create datasets for countries (e.g., DE, LT)
  --clear-cache             Clear the cache before downloading data
  --debug                   Enable debug output
  --no-cache                Disable caching of downloaded data
  --cache-ttl <ms>          Set cache TTL in milliseconds (default: 24 hours)
  --quiet                   Suppress output messages
  -h, --help                Show help

only for 'generate' command:
  --field-names <fields>    Comma-separated list of field names to include in the generated file
  --key-names <keys>        Comma-separated list of key names to include in the generated file
  --format <json|js|ts>     Output format used by generate command (default: '.js')


Examples:
  generate ./output --field-names bic,name --key-names bankcode --countries DE,LT
  bankcode-bic lookup ./output/de.js bankcode 10010010

For more information, visit: https://github.com/aheissenberger/bankcode-bic
`)
  }
}

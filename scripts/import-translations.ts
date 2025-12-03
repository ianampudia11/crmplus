import 'dotenv/config';
import { storage } from '../server/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    try {
        console.log('Starting translation import...');

        const languageCode = 'es';
        const language = await storage.getLanguageByCode(languageCode);

        if (!language) {
            console.error(`Language '${languageCode}' not found.`);
            process.exit(1);
        }

        console.log(`Found language '${languageCode}' with ID: ${language.id}`);

        const translationsPath = path.join(__dirname, '../translations/es.json');
        const fileContent = fs.readFileSync(translationsPath, 'utf8');
        const rawData = JSON.parse(fileContent);

        console.log(`Loaded ${rawData.length} translations from file.`);

        let translations;
        if (Array.isArray(rawData)) {
            console.log('Converting array format to nested format...');
            translations = await storage.convertArrayToNestedFormat(rawData);
        } else {
            translations = rawData;
        }

        console.log('Importing translations to database...');
        const success = await storage.importTranslations(language.id, translations);

        if (success) {
            console.log('Translations imported successfully!');
        } else {
            console.error('Failed to import translations.');
            process.exit(1);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error importing translations:', error);
        process.exit(1);
    }
}

main();

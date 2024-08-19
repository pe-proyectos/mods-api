import AdmZip from 'adm-zip';
import { ValidationError } from '../errors/validation';

export function readManifest(file: ArrayBuffer) {
	const buffer = Buffer.from(file);
	const zip = new AdmZip(buffer);

	const manifestJSON = zip.getEntries().find(entry => entry.entryName.endsWith('manifest.json'));
	if (!manifestJSON) {
		throw new ValidationError([{ field: 'modFile', message: 'Mod .zip must contain manifest.json.' }]);
	}

	const manifest = JSON.parse(manifestJSON.getData().toString('utf8'));

	if (!manifest.version) {
		throw new ValidationError([{ field: 'modFile', message: 'Mod manifest.json must contain a version.' }]);
	}

	return {
		id: manifest?.id,
		version: manifest?.version,
		description: manifest?.description,
		dependencies: manifest?.dependencies?.join(','),
		type: manifest?.type,
	};
}

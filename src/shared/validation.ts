export function validateEmail(email: string) {
	const errors = [];
	const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
	if (!EMAIL_REGEX.test(email)) {
		errors.push({ field: 'email', message: 'Invalid email', });
	}
	return errors;
}

export function validatePassword(password: string, confirm_password: string) {
	const errors = [];
	if (password.length < 8) {
		errors.push({ field: 'password', message: 'Password must be at least 8 characters long', });
	}
	if (password.length > 64) {
		errors.push({ field: 'password', message: 'Password must be at most 64 characters long', });
	}
	if (password.search(/[a-z]/i) < 0) {
		errors.push({ field: 'password', message: 'Password must contain at least one letter', });
	}
	if (password.search(/[0-9]/) < 0) {
		errors.push({ field: 'password', message: 'Password must contain at least one digit', });
	}
	if (password.search(/[!@#$%^&*]/) < 0) {
		errors.push({ field: 'password', message: 'Password must contain at least one special character', });
	}
	if (password !== confirm_password) {
		errors.push({ field: 'password', message: 'Passwords do not match', });
	}
	return errors;
}

export function validateUsername(username: string) {
	const errors = [];
	if (username.length < 4) {
		errors.push({ field: 'username', message: 'Name must be at least 4 characters long', });
	}
	if (username.length > 24) {
		errors.push({ field: 'username', message: 'Name must be at most 24 characters long', });
	}
	if (username.search(/^[a-z0-9]+$/i) < 0) {
		errors.push({ field: 'username', message: 'Name must contain only alphanumeric characters', });
	}
	return errors;
}

export function validateModName(modName: string) {
	const errors = [];
	let name = modName.trim();
	if (name.length < 4) {
		errors.push({ field: 'name', message: 'Mod name must be at least 3 characters long.', });
	}
	if (name.length > 24) {
		errors.push({ field: 'name', message: 'Mod name must be less than 50 characters long.', });
	}
	const allowedPattern = /^[a-zA-Z0-9,.¡!¿?$%&()#+;'" _-]+$/;
	if (!allowedPattern.test(name)) {
		errors.push({ field: 'name', message: 'Mod name must only contain letters, numbers, spaces, dashes and underscores.', });
	}
	return errors;
}

export function validateModDescription(modDescription: string) {
	const errors = [];
	let description = modDescription.trim();
	if (description.length < 10) {
		errors.push({ field: 'description', message: 'Mod description must be at least 10 characters long.', });
	}
	if (description.length > 2000) {
		errors.push({ field: 'description', message: 'Mod description must be less than 2000 characters long. (' + description.length + ')', });
	}
	return errors;
}

export function validateModShortDescription(modShortDescription: string) {
	const errors = [];
	let shortDescription = modShortDescription.trim();
	if (shortDescription.length < 10) {
		errors.push({ field: 'shortDescription', message: 'Mod description must be at least 10 characters long.', });
	}
	if (shortDescription.length > 100) {
		errors.push({ field: 'shortDescription', message: 'Mod description must be less than 100 characters long. (' + modShortDescription.length + ')', });
	}
	return errors;
}

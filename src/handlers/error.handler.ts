import { Elysia } from 'elysia';
import { ValidationError } from '../errors/validation'
import { UnauthorizedError } from '../errors/auth';

export const errorHandler = new Elysia()
    .error('VALIDATION_ERROR', ValidationError)
    .error('UNAUTHORIZED_ERROR', UnauthorizedError)
    .onError({ as: "global" }, ({ code, error, set }) => {
        console.error(error);
        let error_message = error.message;
        let full_error = error.message;
        switch(code) {
            case 'VALIDATION':
                set.status = 400
                const fields: any[] = []
                error_message = "" + error.message.split('\n')[0]
                full_error = error.message
                try {
                    const expected = JSON.parse("" + full_error.match(/(?<=Expected: ).*?(?=Found:)/gs)?.[0].trim())
                    const found = JSON.parse("" + full_error.match(/(?<=Found: ).*$/gs)?.[0].trim())
                    for (const key in expected) {
                        if (expected.hasOwnProperty(key)) {
                            const element = expected[key];
                            if (element !== found[key]) {
                                const expected_type = element == "File" ? "File" : typeof element
                                const found_type = typeof found[key]
                                if (expected_type === "File" && found_type === "object") continue;
                                if (expected_type !== found_type) {
                                    fields.push({ field: key, message: `Expected ${key} to be ${expected_type} but found ${found_type}` })
                                }
                            }
                        }
                    }
                } catch (error) { }
                return { code, error: error_message, full_error, fields }
            case 'VALIDATION_ERROR':
                set.status = 400;
                error_message = "" + error.fields[0].message
                full_error = error.fields.map(field => field.message).join('\n')
                return { code: 'VALIDATION', error: error_message, full_error, fields: error.fields };
            case 'UNAUTHORIZED_ERROR':
                set.status = 401;
                return { code, error: error_message, full_error };
            case 'NOT_FOUND':
                set.status = 404;
                return { code, error: error_message, full_error };
            default:
                return { code, error: error_message, full_error };
        }
    });

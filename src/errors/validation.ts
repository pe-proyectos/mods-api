type ValidationFieldError = { field: string; message: string; };

export class ValidationError extends Error {
    constructor(public fields: ValidationFieldError[]) {
        super(fields?.[0]?.message ?? "Validation error")
        this.fields = fields;
    }
}

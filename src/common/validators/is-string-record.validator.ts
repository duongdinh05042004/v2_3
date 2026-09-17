import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsStringRecord(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isStringRecord',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            return false;
          }
          const entries = Object.entries(value as Record<string, unknown>);
          if (entries.length === 0) {
            return false;
          }
          return entries.every(
            ([key, mapped]) =>
              key.trim().length > 0 &&
              key.length <= 255 &&
              typeof mapped === 'string' &&
              mapped.trim().length > 0 &&
              mapped.length <= 255,
          );
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a non-empty object of string → string field mappings`;
        },
      },
    });
  };
}

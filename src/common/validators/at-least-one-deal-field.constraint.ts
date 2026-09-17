import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'atLeastOneDealField', async: false })
export class AtLeastOneDealFieldConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const body = args.object as { title?: string; amount?: string; stage?: string };
    return Boolean(body.title || body.amount || body.stage);
  }

  defaultMessage(): string {
    return 'At least one of title, amount, or stage is required';
  }
}

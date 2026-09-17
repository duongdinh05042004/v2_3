import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Validate } from 'class-validator';
import { AtLeastOneDealFieldConstraint } from '../../../common/validators/at-least-one-deal-field.constraint';

export class UpdateDealDto {
  @ApiHideProperty()
  @Validate(AtLeastOneDealFieldConstraint)
  _atLeastOne?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: '8000000' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'amount must be a decimal number' })
  amount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  stage?: string;
}

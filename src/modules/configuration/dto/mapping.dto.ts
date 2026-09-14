import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateMappingsDto {
  @ApiProperty({
    example: {
      'lead_data.full_name': 'NAME',
      'lead_data.email': 'EMAIL[0][VALUE]',
      'lead_data.phone': 'PHONE[0][VALUE]',
      'lead_data.city': 'UF_CRM_CITY',
      'campaign.campaign_name': 'UF_CRM_UTM_CAMPAIGN',
      'campaign.ad_name': 'UF_CRM_AD_NAME',
      'lead_data.ttclid': 'UF_CRM_TTCLID',
    },
  })
  @IsObject()
  field_mapping!: Record<string, string>;
}

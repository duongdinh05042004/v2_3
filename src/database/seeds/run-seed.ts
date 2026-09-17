import { AppDataSource } from '../data-source';
import { Campaign } from '../entities/campaign.entity';
import { Configuration } from '../entities/configuration.entity';
import { SalesPerson } from '../entities/sales-person.entity';
import { defaultCampaignCosts, defaultConfigurations, defaultSalesPersons } from './seed-data';

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  const configRepo = AppDataSource.getRepository(Configuration);
  const salesRepo = AppDataSource.getRepository(SalesPerson);
  const campaignRepo = AppDataSource.getRepository(Campaign);

  for (const item of defaultConfigurations) {
    const existing = await configRepo.findOne({ where: { key: item.key } });
    if (existing) {
      existing.value = item.value;
      existing.description = item.description;
      await configRepo.save(existing);
    } else {
      await configRepo.save(configRepo.create(item));
    }
  }

  for (const person of defaultSalesPersons) {
    const existing = await salesRepo.findOne({ where: { externalId: person.externalId } });
    if (existing) {
      existing.name = person.name;
      existing.email = person.email;
      existing.bitrix24UserId = person.bitrix24UserId;
      existing.territories = person.territories;
      existing.specialties = person.specialties;
      existing.maxOpenDeals = person.maxOpenDeals;
      existing.managerExternalId = person.managerExternalId;
      await salesRepo.save(existing);
    } else {
      await salesRepo.save(salesRepo.create(person));
    }
  }

  for (const [campaignId, cost] of Object.entries(defaultCampaignCosts)) {
    const existing = await campaignRepo.findOne({ where: { campaignId } });
    if (!existing) {
      await campaignRepo.save(
        campaignRepo.create({
          campaignId,
          campaignName: 'Spring Sale 2024',
          advertiserId: '7123456789',
          spend: String(cost.spend),
          currency: cost.currency,
        }),
      );
    }
  }

  await AppDataSource.destroy();
  // eslint-disable-next-line no-console
  console.log('Seed data applied.');
}

seed().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventRepository } from '../repositories/event.repository';

@Injectable()
export class EventCronService {
  private readonly logger = new Logger(EventCronService.name);

  constructor(private eventRepository: EventRepository) {}

  @Cron('0 2 * * *')
  async updateEventStatuses() {
    try {
      const now = new Date();

      const publishedEvents = await this.eventRepository.findByStatus('published');
      for (const event of publishedEvents) {
        if (event.startTime <= now && event.endTime > now) {
          await this.eventRepository.update(event.id, { status: 'ongoing' });
          this.logger.log(`Event ${event.id} updated to ongoing`);
        }
      }

      const ongoingEvents = await this.eventRepository.findByStatus('ongoing');
      for (const event of ongoingEvents) {
        if (event.endTime <= now) {
          await this.eventRepository.update(event.id, { status: 'finished' });
          this.logger.log(`Event ${event.id} updated to finished`);
        }
      }
    } catch (error) {
      this.logger.error('Error updating event statuses:', error);
    }
  }
}

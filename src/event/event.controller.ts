import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/get-user.decorator';
import { Public } from '../auth/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('events')
export class EventController {
    constructor(private readonly eventService: EventService) { }


    @Throttle({ default: { limit: 3, ttl: 60000 } })

    @Post()
    @Roles(Role.CREATOR)
    async create(@Body() dto: CreateEventDto, @GetUser('id') creatorId: string) {
        return this.eventService.createEvent(dto, creatorId);
    }

    @Public() // Accessible to all authenticated or unauthenticated users to explore
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    @Get()
    async findAll() {
        return this.eventService.findAllEvents();
    }

    @Throttle({ default: { limit: 3, ttl: 60000 } })
    @Get('creator/my-events')
    @Roles(Role.CREATOR)
    async findMyEvents(@GetUser('id') creatorId: string) {
        return this.eventService.findCreatorEvents(creatorId);
    }
}
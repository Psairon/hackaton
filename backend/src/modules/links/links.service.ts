import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JiraEpic, EpicLinkSource } from '../jira/entities/jira-epic.entity';
import { EstimateTask } from '../baseline/entities/estimate-task.entity';

/** Связка Jira Epic ↔ задача оценки (FR-10, FR-11). */
@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(JiraEpic) private readonly epics: Repository<JiraEpic>,
    @InjectRepository(EstimateTask) private readonly estimateTasks: Repository<EstimateTask>,
  ) {}

  /** Ручная привязка эпика к задаче оценки (FR-10). */
  async link(estimateTaskId: string, epicId: string) {
    const epic = await this.epics.findOne({ where: { id: epicId } });
    if (!epic) throw new NotFoundException('Jira Epic не найден');
    const et = await this.estimateTasks.findOne({ where: { id: estimateTaskId } });
    if (!et) throw new NotFoundException('Задача оценки не найдена');
    if (epic.controlObjectId !== et.controlObjectId) {
      throw new BadRequestException('Эпик и задача оценки из разных объектов контроля');
    }
    await this.epics.update(epicId, {
      estimateTaskId,
      linkSource: EpicLinkSource.MANUAL,
    });
    return this.epics.findOne({ where: { id: epicId } });
  }

  async unlink(estimateTaskId: string, epicId: string) {
    const epic = await this.epics.findOne({ where: { id: epicId } });
    if (!epic) throw new NotFoundException('Jira Epic не найден');
    if (epic.estimateTaskId !== estimateTaskId) {
      throw new BadRequestException('Связь не найдена');
    }
    await this.epics.update(epicId, {
      estimateTaskId: null as unknown as string,
      linkSource: EpicLinkSource.NONE,
    });
    return { ok: true };
  }

  /** Список всех связок ET ↔ Epic для объекта контроля. */
  async links(controlObjectId: string) {
    const ets = await this.estimateTasks.find({ where: { controlObjectId } });
    const epics = await this.epics.find({ where: { controlObjectId } });

    const epicsByEt = new Map<string, typeof epics>();
    for (const e of epics) {
      if (!e.estimateTaskId) continue;
      const arr = epicsByEt.get(e.estimateTaskId) ?? [];
      arr.push(e);
      epicsByEt.set(e.estimateTaskId, arr);
    }

    return ets.map((et) => ({
      estimateTask: { id: et.id, title: et.title, totalHours: et.totalHours },
      linkedEpics: (epicsByEt.get(et.id) ?? []).map((e) => ({
        id: e.id,
        jiraKey: e.jiraKey,
        title: e.title,
        linkSource: e.linkSource,
      })),
    }));
  }

  /** Несвязанные Jira Epic. */
  async unlinkedEpics(controlObjectId: string) {
    return this.epics.find({ where: { controlObjectId, estimateTaskId: null as any } });
  }

  /** Несвязанные EstimateTask. */
  async unlinkedEstimateTasks(controlObjectId: string) {
    const ets = await this.estimateTasks.find({ where: { controlObjectId } });
    const linkedIds = new Set(
      (await this.epics.find({ where: { controlObjectId } }))
        .map((e) => e.estimateTaskId)
        .filter(Boolean),
    );
    return ets.filter((et) => !linkedIds.has(et.id));
  }

  /** Авто-привязка по ключу эпика из baseline (FR-11). */
  async autoLink(controlObjectId: string) {
    const ets = await this.estimateTasks.find({ where: { controlObjectId } });
    const withKey = ets.filter((e) => e.externalEpicKey);
    let linked = 0;
    let ambiguous = 0;
    const ambiguousKeys: string[] = [];

    for (const et of withKey) {
      const matches = await this.epics.find({
        where: { controlObjectId, jiraKey: et.externalEpicKey },
      });
      if (matches.length === 1 && !matches[0].estimateTaskId) {
        await this.epics.update(matches[0].id, {
          estimateTaskId: et.id,
          linkSource: EpicLinkSource.AUTO,
        });
        linked++;
      } else if (matches.length > 1) {
        ambiguous++;
        ambiguousKeys.push(et.externalEpicKey);
      }
    }
    return { candidates: withKey.length, linked, ambiguous, ambiguousKeys };
  }
}

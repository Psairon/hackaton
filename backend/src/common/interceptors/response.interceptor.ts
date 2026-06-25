import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, { data: T; message: string }> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<{ data: T; message: string }> {
    return next.handle().pipe(map((data) => ({ data, message: 'success' })));
  }
}

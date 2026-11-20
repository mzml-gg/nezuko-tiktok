import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
export declare class NumericIdPipe implements PipeTransform<string, string> {
    transform(value: string, { data }: ArgumentMetadata): string;
}

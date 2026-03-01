export type TransformAction =
    | 'rewrite'
    | 'explain'
    | 'define'
    | 'shorten'
    | 'expand';

export interface AIService {
    transform(text: string, action: TransformAction): Promise<string>;
}

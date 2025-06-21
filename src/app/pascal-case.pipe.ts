import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toPascalCase'
})
export class PascalCasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    // Handle multiple input formats:
    // 1. camelCase -> PascalCase
    // 2. snake_case -> PascalCase
    // 3. kebab-case -> PascalCase
    // 4. regular spaced string -> PascalCase

    return value
      // Insert space before capital letters (camelCase)
      .replace(/([A-Z])/g, ' $1')
      // Replace underscores and hyphens with spaces
      .replace(/[_-]/g, ' ')
      // Trim whitespace
      .trim()
      // Capitalize first letter of each word
      .replace(/\w\S*/g, (word) => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      // Remove all spaces
      .replace(/\s+/g, '');
  }
}
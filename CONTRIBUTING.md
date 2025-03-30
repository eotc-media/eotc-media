# Contributing Guidelines

Thank you for considering contributing to this project! Your help is appreciated.

## Getting Started

1. Fork the repository and clone your fork.
2. Run `composer install` and `npm install`.
3. Copy `.env.example` to `.env` and set your local environment variables.
4. Run `php artisan key:generate`.
5. Run `php artisan migrate` (if needed).
6. Start the dev server: `php artisan serve` and `npm run dev`.

## Code Standards

- Follow PSR-12 for PHP code.
- Use camelCase for JavaScript and snake_case for PHP variables.
- Keep the code clean and readable.
- Write clear and concise commit messages.

## Submitting Changes

1. Create a new branch (`git checkout -b feature/my-feature`).
2. Make your changes and commit them.
3. Push to your fork and open a Pull Request.

## Testing

If possible, write or update tests in `tests/Feature` or `tests/Unit`.

Run tests using:

```bash
php artisan test
```

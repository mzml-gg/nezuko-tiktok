export class TikTokError extends Error {
  constructor(message, { status, endpoint, details, cause } = {}) {
    super(message, { cause });
    this.name = 'TikTokError';
    this.status = status;
    this.endpoint = endpoint;
    this.details = details;
  }
}

export class TikTokHttpError extends TikTokError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'TikTokHttpError';
  }
}

export class TikTokValidationError extends TikTokError {
  constructor(message) {
    super(message);
    this.name = 'TikTokValidationError';
  }
}

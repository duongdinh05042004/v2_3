import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  const host = (url = '/api/v1/leads') => {
    const json = jest.fn();
    const response = { status: jest.fn().mockReturnValue({ json }) };
    return {
      host: {
        switchToHttp: () => ({
          getResponse: () => response,
          getRequest: () => ({ method: 'GET', url }),
        }),
      } as unknown as ArgumentsHost,
      json,
      response,
    };
  };

  it('formats HttpException responses', () => {
    const { host: ctx, json, response } = host();
    filter.catch(new HttpException('Nope', HttpStatus.BAD_REQUEST), ctx);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, statusCode: 400 }));
  });

  it('maps unexpected errors to 500', () => {
    const { host: ctx, response } = host();
    filter.catch(new Error('boom'), ctx);
    expect(response.status).toHaveBeenCalledWith(500);
  });
});

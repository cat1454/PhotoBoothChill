import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthenticatedRequestUser => {
  const request = context.switchToHttp().getRequest();
  return request.user;
});

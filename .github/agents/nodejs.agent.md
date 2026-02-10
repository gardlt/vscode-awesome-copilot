---
applyTo: '**/*.ts, **/*.js, **/*.json, **/*.spec.ts, **/*.test.ts'
description: 'Node.js with TypeScript development standards and best practices for building scalable server-side applications'
---

# Node.js + TypeScript Development Best Practices

## Your Mission

As GitHub Copilot, you are an expert in Node.js development with deep knowledge of TypeScript, modern JavaScript patterns, and server-side application architecture. Your goal is to guide developers in building scalable, maintainable, and well-architected Node.js applications using TypeScript and modern development practices.

## Core TypeScript + Node.js Principles

### **1. TypeScript Configuration**
- **Principle:** Use strict TypeScript configuration for better code quality and developer experience.
- **Guidance for Copilot:**
  - Enable strict mode in `tsconfig.json`
  - Use proper type definitions for all variables and function parameters
  - Prefer interfaces over types for object definitions
  - Use generic types for reusable components
  - Implement proper module resolution and path mapping

### **2. Modern JavaScript/TypeScript Patterns**
- **Principle:** Leverage modern ES6+ features and TypeScript-specific capabilities.
- **Guidance for Copilot:**
  - Use async/await instead of callbacks or raw promises
  - Implement proper destructuring and spread operators
  - Use template literals for string interpolation
  - Leverage TypeScript's union types, mapped types, and conditional types
  - Implement proper error handling with try/catch blocks

### **3. Project Architecture**
- **Principle:** Structure projects for maintainability and scalability.
- **Guidance for Copilot:**
  - Separate concerns into distinct layers (routes, services, data access)
  - Use dependency injection patterns where appropriate
  - Implement proper configuration management
  - Create reusable utilities and helpers
  - Follow SOLID principles in class design

## Project Structure Best Practices

### **Recommended Directory Structure**
```
src/
├── index.ts
├── app.ts
├── config/
│   ├── database.ts
│   ├── server.ts
│   └── environment.ts
├── controllers/
│   ├── user.controller.ts
│   └── auth.controller.ts
├── services/
│   ├── user.service.ts
│   └── auth.service.ts
├── models/
│   ├── user.model.ts
│   └── interfaces/
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── routes/
│   ├── index.ts
│   ├── user.routes.ts
│   └── auth.routes.ts
├── utils/
│   ├── logger.ts
│   ├── validation.ts
│   └── helpers.ts
└── types/
    ├── api.types.ts
    └── database.types.ts
```

### **File Naming Conventions**
- **Controllers:** `*.controller.ts` (e.g., `user.controller.ts`)
- **Services:** `*.service.ts` (e.g., `user.service.ts`)
- **Models:** `*.model.ts` (e.g., `user.model.ts`)
- **Routes:** `*.routes.ts` (e.g., `user.routes.ts`)
- **Middleware:** `*.middleware.ts` (e.g., `auth.middleware.ts`)
- **Types:** `*.types.ts` (e.g., `api.types.ts`)
- **Utilities:** `*.util.ts` (e.g., `validation.util.ts`)
- **Tests:** `*.test.ts` or `*.spec.ts`
- **Configuration:** `*.config.ts`

## API Development Patterns

### **1. Express.js with TypeScript**
- Use typed request/response objects
- Implement proper middleware chaining
- Create reusable route handlers
- Use proper HTTP status codes and error handling

```typescript
interface CreateUserRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export const createUser = async (
  req: CreateUserRequest,
  res: Response<UserResponse>
): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const user = await userService.create({ name, email, password });
    
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
};
```

### **2. Service Layer Pattern**
- Implement business logic in service classes
- Use dependency injection for better testability
- Create focused, single-responsibility services
- Return consistent response formats

```typescript
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService
  ) {}

  async create(userData: CreateUserDto): Promise<User> {
    // Validate input
    await this.validateUserData(userData);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword
    });
    
    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);
    
    return user;
  }

  private async validateUserData(userData: CreateUserDto): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }
  }
}
```

### **3. Data Transfer Objects (DTOs)**
- Use interfaces or classes for data validation
- Implement proper input/output type definitions
- Create separate DTOs for different operations

```typescript
// Input DTOs
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}

// Response DTOs
export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Query DTOs
export interface GetUsersQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

## Database Integration

### **Popular ORMs and Query Builders**
- **TypeORM:** Full-featured ORM with TypeScript support
- **Prisma:** Modern database toolkit with great TypeScript integration
- **Sequelize:** Mature ORM with TypeScript support
- **Mongoose:** MongoDB object modeling for Node.js
- **Knex.js:** SQL query builder for Node.js

### **Prisma Example**
```typescript
// schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

// user.service.ts
export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: await bcrypt.hash(data.password, 12)
      }
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { posts: true }
    });
  }
}
```

### **MongoDB with Mongoose**
```typescript
import { Schema, model, Document } from 'mongoose';

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
}, {
  timestamps: true
});

export const User = model<IUser>('User', userSchema);

export class UserService {
  async create(userData: CreateUserDto): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = new User({
      ...userData,
      password: hashedPassword
    });
    return user.save();
  }
}
```

## Authentication and Authorization

### **JWT Authentication with Express**
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET!;
  private readonly jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  async login(email: string, password: string): Promise<{ token: string; user: UserResponseDto }> {
    const user = await this.userService.findByEmail(email);
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.jwtSecret) as JwtPayload;
  }
}
```

### **Authentication Middleware**
```typescript
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = authService.verifyToken(token);
    
    // Attach user to request
    req.user = await userService.findById(payload.userId);
    
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid token'));
  }
};
```

### **Role-Based Authorization**
```typescript
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

// Usage in routes
router.delete('/users/:id', authMiddleware, authorize(['admin']), deleteUser);
```

## Error Handling and Logging

### **Custom Error Classes**
```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
```

### **Error Handling Middleware**
```typescript
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
    return;
  }

  // Handle specific database errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: error.message
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};
```

### **Logging with Winston**
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage
logger.info('User created successfully', { userId: user.id });
logger.error('Database connection failed', { error });
```

## Testing Strategies

### **Unit Testing with Jest**
- Test business logic in isolation using mocks
- Use Jest as the primary testing framework
- Create comprehensive test suites for services and utilities

```typescript
// user.service.test.ts
import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import { EmailService } from '../email.service';

jest.mock('../user.repository');
jest.mock('../email.service');

describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    userRepository = new UserRepository() as jest.Mocked<UserRepository>;
    emailService = new EmailService() as jest.Mocked<EmailService>;
    userService = new UserService(userRepository, emailService);
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      
      const expectedUser = {
        id: 'user-id',
        name: userData.name,
        email: userData.email,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      userRepository.create.mockResolvedValue(expectedUser);
      emailService.sendWelcomeEmail.mockResolvedValue(undefined);

      // Act
      const result = await userService.create(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        password: expect.any(String) // hashed password
      });
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        userData.email,
        userData.name
      );
    });

    it('should throw error when user already exists', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      userRepository.findByEmail.mockResolvedValue({ id: 'existing-user' } as any);

      // Act & Assert
      await expect(userService.create(userData)).rejects.toThrow(ConflictError);
    });
  });
});
```

### **Integration Testing with Supertest**
- Test complete API endpoints
- Use supertest for HTTP testing
- Test authentication and authorization flows

```typescript
// user.routes.test.ts
import request from 'supertest';
import { app } from '../app';
import { User } from '../models/user.model';

describe('User Routes', () => {
  beforeEach(async () => {
    // Clear database or set up test data
    await User.deleteMany({});
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        name: userData.name,
        email: userData.email,
        createdAt: expect.any(String)
      });

      // Verify user was created in database
      const user = await User.findById(response.body.id);
      expect(user).toBeTruthy();
      expect(user!.email).toBe(userData.email);
    });

    it('should return 400 for invalid input', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation Error');
    });
  });

  describe('GET /api/users', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });

    it('should return users when authenticated', async () => {
      // Create test user and get auth token
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword'
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
```

### **Testing Database Operations**
```typescript
// Setup test database
beforeAll(async () => {
  const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
```

## Validation and Input Sanitization

### **Request Validation with Joi**
```typescript
import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number'
    })
});

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new ValidationError(errorMessage));
    }
    
    next();
  };
};

// Usage in routes
router.post('/users', validateRequest(createUserSchema), createUser);
```

### **Input Sanitization**
```typescript
import { escape } from 'html-escaper';
import mongoSanitize from 'express-mongo-sanitize';

// Middleware to sanitize inputs
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Remove any keys that contain '$' and '.'
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.query);
  mongoSanitize.sanitize(req.params);

  // HTML escape string inputs
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = escape(req.body[key]);
    }
  }

  next();
};
```

## Performance and Security

### **Performance Optimization**
```typescript
// Caching with Redis
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;
    
    try {
      const cached = await redis.get(key);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data: any) {
        redis.setex(key, ttl, JSON.stringify(data));
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

// Database query optimization
export class UserService {
  async getUsers(query: GetUsersQueryDto): Promise<{ users: User[]; total: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password') // Exclude password field
        .sort({ [query.sortBy || 'createdAt']: query.sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean() for better performance
      User.countDocuments(filter)
    ]);

    return { users, total };
  }
}
```

### **Security Best Practices**
```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Specific rate limits for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit auth attempts
  skipSuccessfulRequests: true,
});

app.use('/api/auth/login', authLimiter);
```

## Configuration Management

### **Environment Variables with dotenv**
```typescript
// config/environment.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/myapp',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  email: {
    host: process.env.EMAIL_HOST!,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    username: process.env.EMAIL_USERNAME!,
    password: process.env.EMAIL_PASSWORD!,
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}
```

### **Configuration Validation with Joi**
```typescript
import Joi from 'joi';

const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
});

const { error, value: envVars } = configSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = envVars;
```

## Build and Development Tools

### **TypeScript Configuration (tsconfig.json)**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/config/*": ["./config/*"],
      "@/controllers/*": ["./controllers/*"],
      "@/services/*": ["./services/*"],
      "@/models/*": ["./models/*"],
      "@/utils/*": ["./utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### **Package.json Scripts**
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "migrate": "prisma migrate dev",
    "seed": "ts-node src/database/seed.ts"
  }
}
```

### **ESLint Configuration (.eslintrc.js)**
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
  },
};
```

### **Docker Configuration**
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM base AS production

COPY --from=base /app/node_modules ./node_modules
COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## Common Pitfalls to Avoid

- **Blocking the Event Loop:** Avoid synchronous operations in request handlers
- **Memory Leaks:** Properly dispose of event listeners and close database connections
- **Unhandled Promise Rejections:** Always handle promise rejections
- **Exposing Sensitive Data:** Never include passwords or secrets in API responses
- **SQL/NoSQL Injection:** Always validate and sanitize user inputs
- **Missing Error Handling:** Implement comprehensive error handling at all levels
- **Improper Async/Await Usage:** Don't mix callbacks with promises
- **Large Response Payloads:** Implement pagination and field selection
- **Missing Input Validation:** Validate all incoming data
- **Hardcoded Values:** Use environment variables for configuration

```typescript
// ❌ Bad: Blocking operations
const users = fs.readFileSync('users.json'); // Blocks event loop

// ✅ Good: Non-blocking operations
const users = await fs.readFile('users.json');

// ❌ Bad: Unhandled promise rejection
someAsyncOperation(); // No error handling

// ✅ Good: Proper error handling
try {
  await someAsyncOperation();
} catch (error) {
  logger.error('Operation failed', error);
  throw new AppError('Operation failed', 500);
}

// ❌ Bad: Exposing sensitive data
res.json({ user: userWithPassword }); // Includes password

// ✅ Good: Filtering sensitive data
const { password, ...userResponse } = user;
res.json({ user: userResponse });
```

## Development Workflow

### **Project Setup Checklist**
1. Initialize TypeScript project with proper configuration
2. Set up ESLint and Prettier for code quality
3. Configure Jest for testing
4. Set up environment variable validation
5. Implement proper logging configuration
6. Configure database connection with proper error handling
7. Set up authentication and authorization middleware
8. Implement comprehensive error handling
9. Add input validation and sanitization
10. Configure security middleware (helmet, rate limiting)

### **Code Review Checklist**
- [ ] TypeScript types are properly defined and used
- [ ] Input validation is implemented for all endpoints  
- [ ] Error handling is comprehensive and consistent
- [ ] Security best practices are followed
- [ ] Database queries are optimized and protected against injection
- [ ] Authentication and authorization are properly implemented  
- [ ] Logging provides adequate information for debugging
- [ ] Tests provide good coverage of business logic
- [ ] Environment variables are used for configuration
- [ ] Performance considerations are addressed (caching, pagination)

### **Deployment Considerations**
- Use process managers like PM2 for production
- Implement health check endpoints for load balancers
- Set up proper monitoring and alerting
- Configure log aggregation and analysis
- Implement graceful shutdown handling
- Use HTTPS in production with proper certificate management
- Set up database backups and disaster recovery
- Monitor application performance and resource usage

## Popular Framework Options

### **Express.js (Minimalist)**
- Lightweight and flexible
- Large ecosystem of middleware
- Good for REST APIs and web applications

### **Fastify (Performance-focused)**
- High performance HTTP framework
- Built-in JSON schema validation
- TypeScript-first design

### **Koa.js (Modern)**
- Built by Express team using modern JavaScript features
- Better error handling with async/await
- Smaller core with middleware composition

### **NestJS (Enterprise)**
- Angular-inspired with decorators and dependency injection
- Built-in support for TypeScript, validation, and documentation
- Modular architecture with strong opinions

## Conclusion

Node.js with TypeScript provides a powerful platform for building scalable server-side applications. By following these best practices, you can create maintainable, secure, and efficient applications that leverage the full power of TypeScript's type system and Node.js's ecosystem.

Key principles to remember:
- **Type Safety:** Use TypeScript's type system to catch errors early
- **Error Handling:** Implement comprehensive error handling and logging
- **Security:** Validate inputs and protect against common vulnerabilities
- **Performance:** Optimize database queries and implement caching where appropriate
- **Testing:** Write comprehensive tests for all business logic
- **Configuration:** Use environment variables and validate configuration
- **Code Quality:** Use linting, formatting, and code review processes

---

<!-- End of Node.js + TypeScript Instructions -->
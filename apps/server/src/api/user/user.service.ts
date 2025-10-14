import { db } from '../../database';
import { UserRole } from '../../types/user-roles';
import { auth } from '../../lib/auth';
import { sendEmail } from '../../lib/email';
import { HTTPException } from 'hono/http-exception';

// User response type
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  personId: string | null;
  personFullName: string | null;
  personEmail: string | null;
  personFirstName: string | null;
  personLastName: string | null;
}

// User creation input type
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  personId?: string | null;
}

export interface AvailablePerson {
  id: string;
  firstName: string;
  lastName: string;
  emailId: string | null;
}

export interface UpdateUserInput {
  personId?: string | null;
  name?: string;
  email?: string;
  role?: UserRole;
}

const mapUserRow = (row: any): UserResponse => ({
  id: row.id,
  name: row.name,
  email: row.email,
  emailVerified: row.emailVerified,
  image: row.image,
  role: row.role,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  personId: row.personId ?? null,
  personFullName: row.personFirstName
    ? `${row.personFirstName} ${row.personLastName ?? ''}`.trim()
    : null,
  personEmail: row.personEmail ?? null,
  personFirstName: row.personFirstName ?? null,
  personLastName: row.personLastName ?? null,
})

export async function getAllUsers(includeDeleted: boolean = false): Promise<UserResponse[]> {
  let query = db
    .selectFrom('user as u')
    .leftJoin('person as p', 'p.id', 'u.person_id')
    .select([
      'u.id as id',
      'u.name as name',
      'u.email as email',
      'u.emailVerified as emailVerified',
      'u.image as image',
      'u.role as role',
      'u.createdAt as createdAt',
      'u.updatedAt as updatedAt',
      'u.person_id as personId',
      'p.firstName as personFirstName',
      'p.lastName as personLastName',
      'p.emailId as personEmail',
    ])

  if (!includeDeleted) {
    query = query.where('u.deletedAt', 'is', null)
  }

  const rows = await query
    .orderBy('u.createdAt', 'desc')
    .execute()

  return rows.map(mapUserRow)
}

export async function getDeletedUsers(): Promise<UserResponse[]> {
  const rows = await db
    .selectFrom('user as u')
    .leftJoin('person as p', 'p.id', 'u.person_id')
    .select([
      'u.id as id',
      'u.name as name',
      'u.email as email',
      'u.emailVerified as emailVerified',
      'u.image as image',
      'u.role as role',
      'u.createdAt as createdAt',
      'u.updatedAt as updatedAt',
      'u.person_id as personId',
      'p.firstName as personFirstName',
      'p.lastName as personLastName',
      'p.emailId as personEmail',
    ])
    .where('u.deletedAt', 'is not', null)
    .orderBy('u.deletedAt', 'desc')
    .execute()

  return rows.map(mapUserRow)
}

export async function getUserById(id: string): Promise<UserResponse> {
  const row = await db
    .selectFrom('user as u')
    .leftJoin('person as p', 'p.id', 'u.person_id')
    .select([
      'u.id as id',
      'u.name as name',
      'u.email as email',
      'u.emailVerified as emailVerified',
      'u.image as image',
      'u.role as role',
      'u.createdAt as createdAt',
      'u.updatedAt as updatedAt',
      'u.person_id as personId',
      'p.firstName as personFirstName',
      'p.lastName as personLastName',
      'p.emailId as personEmail',
    ])
    .where('u.id', '=', id)
    .where('u.deletedAt', 'is', null)
    .executeTakeFirst()

  if (!row) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  return mapUserRow(row)
}

export async function updateUserRole(id: string, role: UserRole): Promise<UserResponse> {
  await db
    .updateTable('user')
    .set({ 
      role,
      updatedAt: new Date()
    })
    .where('id', '=', id)
    .executeTakeFirstOrThrow();

  return getUserById(id)
}

const ensurePersonAvailable = async (personId: string, userId?: string) => {
  const person = await db
    .selectFrom('person')
    .select('id')
    .where('id', '=', personId)
    .executeTakeFirst()

  if (!person) {
    throw new HTTPException(404, { message: 'Person not found' })
  }

  const existingUser = await db
    .selectFrom('user')
    .select('id')
    .where('person_id', '=', personId)
    .where('deletedAt', 'is', null)
    .executeTakeFirst()

  if (existingUser && existingUser.id !== userId) {
    throw new HTTPException(400, { message: 'This person is already linked to another user.' })
  }
}

export async function getUserRole(id: string): Promise<UserRole> {
  const user = await db
    .selectFrom('user')
    .select('role')
    .where('id', '=', id)
    .executeTakeFirst();

  return user?.role || 'viewer';
}

export async function createUser(input: CreateUserInput): Promise<UserResponse> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const password = input.password

  console.log('createUser - input:', JSON.stringify(input, null, 2))

  if (!password || password.length < 8) {
    throw new HTTPException(400, { message: 'Password must be at least 8 characters.' })
  }

  if (input.personId) {
    console.log('Validating personId:', input.personId)
    await ensurePersonAvailable(input.personId)
  } else {
    console.log('No personId provided')
  }

  return db.transaction().execute(async (trx) => {
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      }
    });

    if (!result || !result.user) {
      throw new HTTPException(500, { message: 'Failed to create user' })
    }

    const userId = result.user.id
    console.log('User created with ID:', userId)

    if (input.role && input.role !== 'viewer') {
      console.log('Setting role:', input.role)
      await trx
        .updateTable('user')
        .set({ role: input.role, updatedAt: new Date() })
        .where('id', '=', userId)
        .executeTakeFirst()
    }

    if (input.personId) {
      console.log('Setting person_id:', input.personId)
      const updateResult = await trx
        .updateTable('user')
        .set({ person_id: input.personId, updatedAt: new Date() })
        .where('id', '=', userId)
        .executeTakeFirst()
      console.log('Update result:', updateResult)

      // If user is a Krama Instructor, update the person's flag
      if (input.role === 'krama_instructor') {
        console.log('Setting is_krama_instructor flag')
        await trx
          .updateTable('person')
          .set({ is_krama_instructor: true })
          .where('id', '=', input.personId)
          .executeTakeFirst()
      }
    } else {
      console.log('Skipping person_id update - no personId')
    }

    return getUserById(userId)
  })
}

export async function resendVerificationEmail(userId: string): Promise<void> {
  const user = await getUserById(userId);

  if (user.emailVerified) {
    throw new Error('User email is already verified');
  }

  // Generate verification token and send email manually
  // Use Better Auth's internal verification token generation
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  // Delete any existing verification tokens for this email
  await db
    .deleteFrom('verification')
    .where('identifier', '=', user.email)
    .execute();

  // Store the new verification token in the database
  await db
    .insertInto('verification')
    .values({
      id: crypto.randomUUID(),
      identifier: user.email,
      value: token,
      expiresAt,
    })
    .execute();

  // Build verification URL
  const verificationUrl = `${process.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(process.env.ORIGIN!)}`;

  // Send the verification email using the configured email service
  await sendEmail({
    to: user.email,
    subject: 'Verify your email address',
    text: `Click the link to verify your email: ${verificationUrl}`,
  });
}

export async function deleteUser(id: string): Promise<void> {
  // Soft delete - set deletedAt timestamp
  await db
    .updateTable('user')
    .set({
      person_id: null,
      deletedAt: new Date(),
      updatedAt: new Date()
    })
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}

export async function undeleteUser(id: string): Promise<UserResponse> {
  // Restore deleted user by setting deletedAt to null
  await db
    .updateTable('user')
    .set({
      deletedAt: null,
      updatedAt: new Date()
    })
    .where('id', '=', id)
    .where('deletedAt', 'is not', null)
    .executeTakeFirstOrThrow();

  // Return the restored user (need to query without the deletedAt filter)
  const row = await db
    .selectFrom('user as u')
    .leftJoin('person as p', 'p.id', 'u.person_id')
    .select([
      'u.id as id',
      'u.name as name',
      'u.email as email',
      'u.emailVerified as emailVerified',
      'u.image as image',
      'u.role as role',
      'u.createdAt as createdAt',
      'u.updatedAt as updatedAt',
      'u.person_id as personId',
      'p.firstName as personFirstName',
      'p.lastName as personLastName',
      'p.emailId as personEmail',
    ])
    .where('u.id', '=', id)
    .executeTakeFirst()

  if (!row) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  return mapUserRow(row)
}

export async function getAvailablePersons(): Promise<AvailablePerson[]> {
  return db
    .selectFrom('person as p')
    .leftJoin('user as u', (join) =>
      join.onRef('u.person_id', '=', 'p.id').on('u.deletedAt', 'is', null),
    )
    .select([
      'p.id as id',
      'p.firstName as firstName',
      'p.lastName as lastName',
      'p.emailId as emailId',
    ])
    .where('u.id', 'is', null)
    .orderBy('p.firstName')
    .orderBy('p.lastName')
    .execute()
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserResponse> {
  return db.transaction().execute(async (trx) => {
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    // Get current user to check for changes
    const currentUser = await getUserById(id)
    const oldPersonId = currentUser.personId
    const oldRole = currentUser.role

    if (input.personId !== undefined) {
      if (input.personId === null) {
        updates.person_id = null
      } else {
        await ensurePersonAvailable(input.personId, id)
        updates.person_id = input.personId
      }
    }

    if (input.name !== undefined) {
      updates.name = input.name
    }

    if (input.email !== undefined) {
      updates.email = input.email
    }

    if (input.role !== undefined) {
      updates.role = input.role
    }

    if (Object.keys(updates).length > 1) {
      await trx
        .updateTable('user')
        .set(updates)
        .where('id', '=', id)
        .executeTakeFirstOrThrow()
    }

    // Handle person's is_krama_instructor flag
    const newPersonId = input.personId !== undefined ? input.personId : oldPersonId
    const newRole = input.role !== undefined ? input.role : oldRole

    // If person changed, update old person's flag if they were a krama instructor
    if (input.personId !== undefined && oldPersonId && oldPersonId !== newPersonId && oldRole === 'krama_instructor') {
      await trx
        .updateTable('person')
        .set({ is_krama_instructor: false })
        .where('id', '=', oldPersonId)
        .executeTakeFirst()
    }

    // If new person is linked and role is krama_instructor, set their flag
    if (newPersonId && newRole === 'krama_instructor') {
      await trx
        .updateTable('person')
        .set({ is_krama_instructor: true })
        .where('id', '=', newPersonId)
        .executeTakeFirst()
    }

    // If role changed from krama_instructor and person is still linked, unset their flag
    if (input.role !== undefined && oldRole === 'krama_instructor' && newRole !== 'krama_instructor' && newPersonId) {
      await trx
        .updateTable('person')
        .set({ is_krama_instructor: false })
        .where('id', '=', newPersonId)
        .executeTakeFirst()
    }

    return getUserById(id)
  })
}

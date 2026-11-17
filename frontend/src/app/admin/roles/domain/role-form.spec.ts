import { EMPTY_ROLE_FORM, RoleForm, parseRoleForm, toRoleForm } from './role-form';

const VALID: RoleForm = {
  id: 'coach',
  name: ' Entrenador ',
  description: '',
  permissions: ['routes.manage', 'admin.access'],
};

describe('role form', () => {
  it('builds the request: trimmed, catalogue-ordered, with no empty description', () => {
    expect(parseRoleForm(VALID, false).input).toEqual({
      id: 'coach',
      name: 'Entrenador',
      permissions: ['admin.access', 'routes.manage'],
    });
  });

  it('keeps a description when there is one', () => {
    expect(parseRoleForm({ ...VALID, description: ' Apoya a los clubes ' }, false).input).toEqual(
      expect.objectContaining({ description: 'Apoya a los clubes' }),
    );
  });

  it('accepts a role with no permissions', () => {
    expect(parseRoleForm({ ...VALID, permissions: [] }, false).input?.permissions).toEqual([]);
  });

  it('explains every invalid field in Spanish and builds nothing', () => {
    const { input, errors } = parseRoleForm(
      { ...EMPTY_ROLE_FORM, id: 'A b', description: 'x'.repeat(201) },
      false,
    );

    expect(input).toBeUndefined();
    expect(errors?.id).toContain('minúsculas');
    expect(errors?.name).toBe('El nombre es obligatorio.');
    expect(errors?.description).toContain('200');
  });

  it.each(['a', 'Coach', '1coach', 'co ach', 'x'.repeat(33)])('rejects the id "%s"', (id) => {
    expect(parseRoleForm({ ...VALID, id }, false).errors?.id).toBeDefined();
  });

  it.each(['ab', 'club_rep', 'a1', 'x'.repeat(32)])('accepts the id "%s"', (id) => {
    expect(parseRoleForm({ ...VALID, id }, false).errors?.id).toBeUndefined();
  });

  it('rejects a name longer than 60 characters', () => {
    expect(parseRoleForm({ ...VALID, name: 'x'.repeat(61) }, false).errors?.name).toContain('60');
  });

  it('does not validate the id of a stored role being edited', () => {
    expect(parseRoleForm({ ...VALID, id: 'Legacy Id' }, true).input).toBeDefined();
  });

  it('fills the form from a stored role', () => {
    expect(
      toRoleForm({
        id: 'coach',
        name: 'Entrenador',
        description: 'Apoya',
        permissions: ['admin.access'],
        system: false,
      }),
    ).toEqual({ id: 'coach', name: 'Entrenador', description: 'Apoya', permissions: ['admin.access'] });
  });
});

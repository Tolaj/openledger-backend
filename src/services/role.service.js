import Role, { buildAdminPermissions } from "../models/role.model.js";

export const getRoles = (groupId) =>
  Role.find({ groupId }).sort({ isSystem: -1, createdAt: 1 });

export const getRoleById = async (id, groupId) => {
  const role = await Role.findOne({ _id: id, groupId });
  if (!role) throw Object.assign(new Error("Role not found"), { status: 404 });
  return role;
};

export const createRole = async (body) => {
  const role = new Role(body);
  return role.save();
};

export const updateRole = async (id, groupId, body) => {
  const role = await Role.findOne({ _id: id, groupId });
  if (!role) throw Object.assign(new Error("Role not found"), { status: 404 });
  if (role.isSystem) throw Object.assign(new Error("System roles cannot be modified"), { status: 403 });
  Object.assign(role, body);
  return role.save();
};

export const deleteRole = async (id, groupId) => {
  const role = await Role.findOne({ _id: id, groupId });
  if (!role) throw Object.assign(new Error("Role not found"), { status: 404 });
  if (role.isSystem) throw Object.assign(new Error("System roles cannot be deleted"), { status: 403 });
  await role.deleteOne();
};

// Called when a business group is created — sets up the Admin system role
export const createAdminRole = async (groupId, creatorUserId) => {
  const role = new Role({
    groupId,
    name:        "Admin",
    description: "Full access to all features",
    isDefault:   false,
    isSystem:    true,
    permissions: buildAdminPermissions(),
  });
  return role.save();
};

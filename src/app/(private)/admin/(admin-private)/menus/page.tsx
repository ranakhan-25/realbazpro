"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Tree,
  Typography,
  message,
} from "antd";

import type { DataNode, TreeProps } from "antd/es/tree";
import {
  ApartmentOutlined,
  AppstoreOutlined,
  DeleteOutlined,
  DownOutlined,
  DragOutlined,
  EditOutlined,
  GlobalOutlined,
  MenuOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SwapOutlined,
} from "@ant-design/icons";

import { useTheme } from "@/lib/theme";
import { getStoredUserProfile } from "@/lib/admin-auth/adminAuthStorage";
import { tenantCmsService, TenantMenu, TenantMenuItem } from "@/services/tenantCmsService";
import { getOrganizations, Organization } from "@/services/organizationService";
import {
  adminMenuService,
  AdminMenuItemNode,
  ReorderAdminMenuItemPayload,
} from "@/services/adminMenuService";

const { Text } = Typography;
const BORDER_COLOR = "#e5e7eb";

// Available Lucide icon suggestions for Admin Sidebar
const POPULAR_ICONS = [
  "LayoutDashboard",
  "Boxes",
  "Building2",
  "CreditCard",
  "Menu",
  "Settings",
  "User",
  "Users",
  "ShieldCheck",
  "KeyRound",
  "FileCog",
  "History",
  "Gauge",
  "FileText",
  "Settings2",
  "Layers",
  "Database",
  "BarChart3",
  "Bell",
  "Sliders",
];

export default function MenusPage() {
  const profile = typeof window !== "undefined" ? getStoredUserProfile() : null;
  const isSuperAdmin = Boolean(
    profile?.isSuperUser ||
      profile?.role === "super-admin" ||
      (profile?.roles && profile.roles.includes("super_admin")) ||
      (profile?.roles && profile.roles.includes("super-admin"))
  );

  const [form] = Form.useForm();
  const themeContext = useTheme();
  const brandColor = themeContext?.primaryColor || "#0000F2";

  // Menu Scope: "admin-sidebar" (CMS for admin dashboard) vs "tenant-website" (CMS for public websites)
  const [menuScope, setMenuScope] = useState<"admin-sidebar" | "tenant-website">("admin-sidebar");

  // Admin Sidebar Role Target: "super-admin" vs "org-admin" vs "all"
  const [adminRole, setAdminRole] = useState<string>("super-admin");

  // Admin Menu items state
  const [adminMenuItems, setAdminMenuItems] = useState<AdminMenuItemNode[]>([]);
  const [adminTreeData, setAdminTreeData] = useState<DataNode[]>([]);
  const [reorderDirty, setReorderDirty] = useState<boolean>(false);

  // Tenant public website menus state
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>(undefined);
  const [menus, setMenus] = useState<TenantMenu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<number | undefined>(undefined);
  const [menuItems, setMenuItems] = useState<TenantMenuItem[]>([]);

  // Common UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [selectedKey, setSelectedKey] = useState<number | null>(null);

  // Helper to build Ant Design Tree Data for Admin Menus
  const buildAdminTreeNodes = (nodes: AdminMenuItemNode[]): DataNode[] => {
    return nodes.map((node) => ({
      key: node.id,
      title: (
        <div className="flex items-center justify-between gap-2 py-0.5 w-full">
          <span className="font-medium text-slate-800 text-xs">
            {node.title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {node.icon && (
              <Tag color="blue" className="text-[10px] m-0 px-1 py-0">
                {node.icon}
              </Tag>
            )}
            {node.url && (
              <span className="text-[11px] text-slate-400 font-mono">
                {node.url}
              </span>
            )}
            <Tag
              color={
                node.role === "super-admin"
                  ? "purple"
                  : node.role === "org-admin"
                  ? "cyan"
                  : "default"
              }
              className="text-[10px] m-0 px-1 py-0"
            >
              {node.role || "all"}
            </Tag>
          </div>
        </div>
      ),
      children: node.children && node.children.length > 0 ? buildAdminTreeNodes(node.children) : [],
      raw: node,
    }));
  };

  // Load Admin Sidebar Menus
  const loadAdminMenus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminMenuService.getMenuTree(adminRole);
      setAdminMenuItems(data);
      setAdminTreeData(buildAdminTreeNodes(data));
      setReorderDirty(false);
    } catch {
      message.error("Failed to load admin dashboard sidebar menus");
    } finally {
      setLoading(false);
    }
  }, [adminRole]);

  // Load organizations for tenant public menus
  useEffect(() => {
    if (isSuperAdmin) {
      getOrganizations()
        .then((data: Organization[]) => {
          setOrgs(data);
          if (data.length > 0 && selectedOrgId === undefined) {
            setSelectedOrgId(data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  // Load Tenant Public Website Menus
  const loadTenantMenus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tenantCmsService.getMenus(selectedOrgId);
      setMenus(data);
      if (data.length > 0) {
        const active = selectedMenuId ? data.find((m) => m.id === selectedMenuId) || data[0] : data[0];
        setSelectedMenuId(active.id);
        setMenuItems(active.items || []);
      } else {
        setMenuItems([]);
      }
    } catch {
      message.error("Failed to load tenant navigation menus");
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId, selectedMenuId]);

  useEffect(() => {
    if (menuScope === "admin-sidebar") {
      loadAdminMenus();
    } else {
      loadTenantMenus();
    }
  }, [menuScope, adminRole, selectedOrgId]);

  // When selectedMenuId changes in tenant-website scope
  useEffect(() => {
    if (menuScope === "tenant-website" && selectedMenuId && menus.length > 0) {
      const active = menus.find((m) => m.id === selectedMenuId);
      if (active) {
        setMenuItems(active.items || []);
      }
    }
  }, [selectedMenuId, menus, menuScope]);

  // Tree Data for Tenant Public Website
  const tenantTreeData = useMemo(() => {
    const itemMap = new Map<number, DataNode & { raw: TenantMenuItem }>();
    const roots: (DataNode & { raw: TenantMenuItem })[] = [];

    menuItems.forEach((item) => {
      itemMap.set(item.id, {
        key: item.id,
        title: (
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="font-medium text-slate-800 text-xs">{item.title}</span>
            <span className="text-[11px] text-slate-400 font-mono">{item.url}</span>
          </div>
        ),
        children: [],
        raw: item,
      });
    });

    menuItems.forEach((item) => {
      const node = itemMap.get(item.id);
      if (node) {
        if (item.parentId && itemMap.has(item.parentId)) {
          itemMap.get(item.parentId)?.children?.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  }, [menuItems]);

  // Parent Options for select
  const parentOptions = useMemo(() => {
    if (menuScope === "admin-sidebar") {
      const flattenNodes = (nodes: AdminMenuItemNode[]): { label: string; value: number }[] => {
        let result: { label: string; value: number }[] = [];
        nodes.forEach((n) => {
          if (!editingItem || n.id !== editingItem.id) {
            result.push({
              label: `${n.title} (${n.url || "Group"})`,
              value: n.id,
            });
            if (n.children && n.children.length > 0) {
              result = result.concat(flattenNodes(n.children));
            }
          }
        });
        return result;
      };

      return [{ label: "Root Level (No Parent / Group)", value: 0 }, ...flattenNodes(adminMenuItems)];
    }

    return [
      { label: "Root Level (No Parent)", value: 0 },
      ...menuItems
        .filter((item) => !editingItem || item.id !== editingItem.id)
        .map((item) => ({
          label: `${item.title} (${item.url})`,
          value: item.id,
        })),
    ];
  }, [menuScope, adminMenuItems, menuItems, editingItem]);

  // Handle select node in Tree
  const handleSelectNode: TreeProps["onSelect"] = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      const id = Number(selectedKeys[0]);
      setSelectedKey(id);
      const raw = (info.node as any).raw;
      if (raw) {
        setEditingItem(raw);
        if (menuScope === "admin-sidebar") {
          form.setFieldsValue({
            title: raw.title,
            url: raw.url || "",
            icon: raw.icon || "",
            role: raw.role || "all",
            parentId: raw.parentId || 0,
            orderIndex: raw.order || 1,
            isVisible: raw.isVisible !== false,
          });
        } else {
          form.setFieldsValue({
            title: raw.title,
            url: raw.url,
            target: raw.target || "_self",
            parentId: raw.parentId || 0,
            orderIndex: raw.orderIndex || 1,
            isVisible: raw.isVisible !== false,
          });
        }
      }
    } else {
      handleAddNew();
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setSelectedKey(null);
    form.resetFields();
    if (menuScope === "admin-sidebar") {
      form.setFieldsValue({
        role: adminRole === "all" ? "all" : adminRole,
        parentId: 0,
        orderIndex: 10,
        isVisible: true,
        url: "",
      });
    } else {
      form.setFieldsValue({
        target: "_self",
        parentId: 0,
        orderIndex: 1,
        isVisible: true,
        url: "/",
      });
    }
  };

  // Drag and Drop reordering on Ant Design Tree
  const handleAdminDrop: TreeProps["onDrop"] = (info) => {
    const dropKey = Number(info.node.key);
    const dragKey = Number(info.dragNode.key);
    const dropPos = info.node.pos.split("-");
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const data = [...adminTreeData];

    // Find dragged object
    let dragObj: any;
    const loop = (
      nodes: any[],
      key: number,
      callback: (item: any, index: number, arr: any[]) => void
    ) => {
      for (let i = 0; i < nodes.length; i++) {
        if (Number(nodes[i].key) === key) {
          return callback(nodes[i], i, nodes);
        }
        if (nodes[i].children) {
          loop(nodes[i].children, key, callback);
        }
      }
    };

    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    if (!info.dropToGap) {
      // Drop inside target node as child
      loop(data, dropKey, (item) => {
        item.children = item.children || [];
        item.children.push(dragObj);
      });
    } else if (
      (info.node.children || []).length > 0 &&
      info.node.expanded &&
      dropPosition === 1
    ) {
      loop(data, dropKey, (item) => {
        item.children = item.children || [];
        item.children.unshift(dragObj);
      });
    } else {
      let ar: any[] = [];
      let i = 0;
      loop(data, dropKey, (_item, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj);
      } else {
        ar.splice(i + 1, 0, dragObj);
      }
    }

    setAdminTreeData(data);
    setReorderDirty(true);
    message.info("Structure altered. Click 'Save Hierarchy Order' to persist changes.");
  };

  // Save the reordered tree to backend
  const handleSaveReorder = async () => {
    try {
      setSaving(true);
      const updates: ReorderAdminMenuItemPayload[] = [];

      const traverse = (nodes: any[], parentId: number | null) => {
        nodes.forEach((node, index) => {
          const id = Number(node.key);
          updates.push({
            id,
            order: index + 1,
            parentId: parentId,
          });
          if (node.children && node.children.length > 0) {
            traverse(node.children, id);
          }
        });
      };

      traverse(adminTreeData, null);

      await adminMenuService.reorderTree(updates);
      message.success("Hierarchy order successfully updated and saved");
      setReorderDirty(false);
      loadAdminMenus();
    } catch {
      message.error("Failed to save reordered hierarchy");
    } finally {
      setSaving(false);
    }
  };

  // Submit Add / Edit Form
  const onFinish = async (values: any) => {
    try {
      setSaving(true);
      if (menuScope === "admin-sidebar") {
        const payload: Partial<AdminMenuItemNode> = {
          title: values.title,
          url: values.url || "",
          icon: values.icon || "",
          role: values.role || "all",
          order: Number(values.orderIndex) || 1,
          parentId: values.parentId === 0 ? null : Number(values.parentId),
          isVisible: values.isVisible,
        };

        if (editingItem) {
          await adminMenuService.updateMenuItem(editingItem.id, payload);
          message.success("Admin menu item updated");
        } else {
          await adminMenuService.createMenuItem(payload);
          message.success("Admin menu item created");
        }
        handleAddNew();
        loadAdminMenus();
      } else {
        if (!selectedMenuId) {
          message.warning("Please create or select a menu group first");
          return;
        }

        const payload = {
          menuId: selectedMenuId,
          title: values.title,
          url: values.url,
          target: values.target,
          parentId: values.parentId === 0 ? null : Number(values.parentId),
          orderIndex: Number(values.orderIndex) || 1,
          isVisible: values.isVisible,
        };

        if (editingItem) {
          await tenantCmsService.updateMenuItem(editingItem.id, payload);
          message.success("Navigation item updated");
        } else {
          await tenantCmsService.createMenuItem(payload);
          message.success("Navigation item added");
        }
        handleAddNew();
        loadTenantMenus();
      }
    } catch {
      message.error("Failed to save menu item");
    } finally {
      setSaving(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: number) => {
    try {
      setSaving(true);
      if (menuScope === "admin-sidebar") {
        await adminMenuService.deleteMenuItem(id);
        message.success("Admin menu item deleted");
        handleAddNew();
        loadAdminMenus();
      } else {
        await tenantCmsService.deleteMenuItem(id);
        message.success("Navigation item deleted");
        handleAddNew();
        loadTenantMenus();
      }
    } catch {
      message.error("Failed to delete item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AppstoreOutlined className="text-xl text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Navigation & Menu CMS
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual Drag and Drop CMS to customize the Admin Dashboard sidebar and Tenant Public Websites.
          </p>
        </div>

        {/* CMS Scope Switcher */}
        <Radio.Group
          value={menuScope}
          onChange={(e) => {
            setMenuScope(e.target.value);
            handleAddNew();
          }}
          buttonStyle="solid"
          size="middle"
        >
          <Radio.Button value="admin-sidebar">
            <Space orientation="horizontal">
              <ApartmentOutlined />
              <span>Admin Dashboard Sidebar</span>
            </Space>
          </Radio.Button>
          <Radio.Button value="tenant-website">
            <Space orientation="horizontal">
              <GlobalOutlined />
              <span>Tenant Website Navigation</span>
            </Space>
          </Radio.Button>
        </Radio.Group>
      </div>

      {/* SCOPE 1: ADMIN DASHBOARD SIDEBAR CMS */}
      {menuScope === "admin-sidebar" && (
        <div className="space-y-4">
          {/* Top Controls: Role selector and Actions */}
          <Card size="small" style={{ borderColor: BORDER_COLOR }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex orientation-row items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">Target Role View:</span>
                <Select
                  value={adminRole}
                  onChange={(val) => {
                    setAdminRole(val);
                    handleAddNew();
                  }}
                  style={{ width: 220 }}
                  options={[
                    { label: "Super Admin Sidebar", value: "super-admin" },
                    { label: "Organization Admin Sidebar", value: "org-admin" },
                    { label: "All Configured Menus", value: "all" },
                  ]}
                />
                <Button
                  icon={<ReloadOutlined />}
                  size="middle"
                  onClick={loadAdminMenus}
                  loading={loading}
                >
                  Refresh
                </Button>
              </div>

              <div className="flex orientation-row items-center gap-2">
                {reorderDirty && (
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveReorder}
                    loading={saving}
                    style={{ backgroundColor: brandColor }}
                  >
                    Save Hierarchy Order
                  </Button>
                )}
                <Button
                  type="default"
                  icon={<PlusOutlined />}
                  onClick={handleAddNew}
                >
                  New Menu Link / Group
                </Button>
              </div>
            </div>
          </Card>

          {/* CMS Grid */}
          <Row gutter={[16, 16]}>
            {/* Left: Drag-and-Drop Hierarchy Preview */}
            <Col xs={24} md={10}>
              <Card
                title={
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <DragOutlined className="text-blue-600" />
                      Sidebar Hierarchy Preview (Drag & Drop)
                    </span>
                    <Tooltip title="Drag items up or down to reorder, or drop onto another item to nest as child submenu">
                      <span className="text-[11px] text-slate-400 cursor-pointer">
                        Drag to reorder
                      </span>
                    </Tooltip>
                  </div>
                }
                style={{ borderColor: BORDER_COLOR }}
                bodyStyle={{ padding: "12px 16px" }}
              >
                {loading ? (
                  <div className="py-12 flex justify-center">
                    <Spin tip="Loading navigation tree..." />
                  </div>
                ) : adminTreeData.length === 0 ? (
                  <Empty description="No sidebar menus configured for this role" />
                ) : (
                  <div className="space-y-2">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 flex items-center justify-between">
                      <span>Drag nodes to reorder order or nest under parents</span>
                      {reorderDirty && (
                        <span className="text-amber-600 font-semibold">● Unsaved Changes</span>
                      )}
                    </div>
                    <Tree
                      draggable
                      blockNode
                      showLine
                      switcherIcon={<DownOutlined />}
                      treeData={adminTreeData}
                      selectedKeys={selectedKey ? [selectedKey] : []}
                      onSelect={handleSelectNode}
                      onDrop={handleAdminDrop}
                      className="py-1"
                    />
                  </div>
                )}
              </Card>
            </Col>

            {/* Right: Item Form */}
            <Col xs={24} md={14}>
              <Card
                title={
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {editingItem
                        ? `Edit: ${editingItem.name}`
                        : "Add New Sidebar Navigation Link / Group"}
                    </span>
                    {editingItem && (
                      <Popconfirm
                        title="Delete menu item?"
                        description="This item and any nested links will be permanently deleted."
                        onConfirm={() => handleDeleteItem(editingItem.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                          Delete Link
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                }
                style={{ borderColor: BORDER_COLOR }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  initialValues={{
                    role: adminRole === "all" ? "all" : adminRole,
                    parentId: 0,
                    orderIndex: 10,
                    isVisible: true,
                    url: "",
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Display Title"
                        name="title"
                        rules={[{ required: true, message: "Title is required" }]}
                      >
                        <Input placeholder="e.g. Audit Logs, Analytics, User Management" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Navigation Route URL (Leave empty for parent group header)"
                        name="url"
                      >
                        <Input placeholder="e.g. /admin/audit, /admin/plans" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Lucide Icon Name"
                        name="icon"
                        tooltip="Select or type any Lucide icon name like LayoutDashboard, Users, ShieldCheck"
                      >
                        <Select
                          showSearch
                          allowClear
                          placeholder="Select icon or enter custom"
                          options={POPULAR_ICONS.map((icon) => ({
                            label: icon,
                            value: icon,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Assigned Role Visibility"
                        name="role"
                        tooltip="Controls which dashboard role sees this sidebar item"
                      >
                        <Select
                          options={[
                            { label: "Super Admin Only", value: "super-admin" },
                            { label: "Organization Admin Only", value: "org-admin" },
                            { label: "Universal / All Roles", value: "all" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Parent Menu Group" name="parentId">
                        <Select
                          options={parentOptions}
                          placeholder="Select parent or leave as Root"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="Sort Order Index" name="orderIndex">
                        <Input type="number" placeholder="1, 2, 3..." />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        label="Visible in Sidebar"
                        name="isVisible"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    {editingItem && (
                      <Button onClick={handleAddNew}>
                        Cancel Edit
                      </Button>
                    )}
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={saving}
                      icon={<SaveOutlined />}
                      style={{ backgroundColor: brandColor }}
                    >
                      {editingItem ? "Update Menu Item" : "Save Menu Item"}
                    </Button>
                  </div>
                </Form>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* SCOPE 2: TENANT PUBLIC WEBSITE NAVIGATION */}
      {menuScope === "tenant-website" && (
        <div className="space-y-4">
          {/* Tenant Selector for Super Admin */}
          {isSuperAdmin && (
            <Card size="small" style={{ borderColor: BORDER_COLOR }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700">Managing Tenant:</span>
                  <Select
                    value={selectedOrgId}
                    onChange={(val) => {
                      setSelectedOrgId(val);
                      setSelectedMenuId(undefined);
                      handleAddNew();
                    }}
                    style={{ width: 260 }}
                    placeholder="Select tenant organization"
                    options={orgs.map((o) => ({
                      label: `${o.name} (${o.code || "No code"})`,
                      value: o.id,
                    }))}
                  />
                </div>
                <Button
                  icon={<ReloadOutlined />}
                  size="small"
                  onClick={loadTenantMenus}
                  loading={loading}
                >
                  Refresh
                </Button>
              </div>
            </Card>
          )}

          {/* Menu Groups */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              Tenant Menu Slots:
            </span>
            {menus.map((m) => (
              <Button
                key={m.id}
                type={selectedMenuId === m.id ? "primary" : "default"}
                size="small"
                onClick={() => {
                  setSelectedMenuId(m.id);
                  handleAddNew();
                }}
                style={selectedMenuId === m.id ? { backgroundColor: brandColor } : {}}
              >
                {m.name} ({m.location})
              </Button>
            ))}
          </div>

          <Row gutter={[16, 16]}>
            {/* Left: Hierarchy Tree */}
            <Col xs={24} md={10}>
              <Card
                title={
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Navigation Hierarchy</span>
                    <Button
                      size="small"
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={handleAddNew}
                    >
                      Add Link
                    </Button>
                  </div>
                }
                style={{ borderColor: BORDER_COLOR }}
              >
                {tenantTreeData.length === 0 ? (
                  <Empty description="No menu items configured for this tenant" />
                ) : (
                  <Tree
                    showLine
                    switcherIcon={<DownOutlined />}
                    treeData={tenantTreeData}
                    selectedKeys={selectedKey ? [selectedKey] : []}
                    onSelect={handleSelectNode}
                    className="py-2"
                  />
                )}
              </Card>
            </Col>

            {/* Right: Form */}
            <Col xs={24} md={14}>
              <Card
                title={
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {editingItem ? `Edit: ${editingItem.name}` : "Add New Navigation Link"}
                    </span>
                    {editingItem && (
                      <Popconfirm
                        title="Delete menu item?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDeleteItem(editingItem.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                          Delete Link
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                }
                style={{ borderColor: BORDER_COLOR }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  initialValues={{
                    target: "_self",
                    parentId: 0,
                    orderIndex: 1,
                    isVisible: true,
                    url: "/",
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Link Title"
                        name="title"
                        rules={[{ required: true, message: "Title is required" }]}
                      >
                        <Input placeholder="e.g. Products, About Us, Portal" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Target URL"
                        name="url"
                        rules={[{ required: true, message: "URL is required" }]}
                      >
                        <Input placeholder="e.g. /products, /pricing, https://..." />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Parent Menu Link" name="parentId">
                        <Select options={parentOptions} placeholder="Select parent link" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Target Window" name="target">
                        <Select
                          options={[
                            { label: "Same Tab (_self)", value: "_self" },
                            { label: "New Tab (_blank)", value: "_blank" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Sort Order Index" name="orderIndex">
                        <Input type="number" placeholder="1, 2, 3..." />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Item Visible"
                        name="isVisible"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="flex justify-end gap-3 pt-3 border-t">
                    {editingItem && (
                      <Button onClick={handleAddNew}>
                        Cancel Edit
                      </Button>
                    )}
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={saving}
                      icon={<SaveOutlined />}
                      style={{ backgroundColor: brandColor }}
                    >
                      {editingItem ? "Update Link" : "Save Item"}
                    </Button>
                  </div>
                </Form>
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}

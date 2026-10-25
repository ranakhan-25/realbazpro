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
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tooltip,
  Tree,
  Typography,
  message,
} from "antd";

import type { DataNode, TreeProps } from "antd/es/tree";
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";

import { useTheme } from "@/lib/theme";
import { getStoredUserProfile } from "@/lib/admin-auth/adminAuthStorage";
import { tenantCmsService, TenantMenu, TenantMenuItem } from "@/services/tenantCmsService";
import { getOrganizations, Organization } from "@/services/organizationService";

const { Text } = Typography;
const BORDER_COLOR = "#e5e7eb";

export default function MenusPage() {
  const profile = typeof window !== "undefined" ? getStoredUserProfile() : null;
  const isSuperAdmin = Boolean(profile?.isSuperUser || (profile?.roles && profile.roles.includes("super_admin")));
  const [form] = Form.useForm();
  const themeContext = useTheme();
  const brandColor = themeContext?.primaryColor || "#0000F2";

  // Super Admin tenant selection
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>(undefined);

  // Tenant menus state
  const [menus, setMenus] = useState<TenantMenu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<number | undefined>(undefined);
  const [menuItems, setMenuItems] = useState<TenantMenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form edit mode
  const [editingItem, setEditingItem] = useState<TenantMenuItem | null>(null);
  const [selectedKey, setSelectedKey] = useState<number | null>(null);

  // Load organizations if super admin
  useEffect(() => {
    if (isSuperAdmin) {
      getOrganizations().then((data: Organization[]) => {
        setOrgs(data);
        if (data.length > 0 && selectedOrgId === undefined) {
          setSelectedOrgId(data[0].id);
        }
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  // Load menus for active tenant
  const loadTenantMenus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tenantCmsService.getMenus(selectedOrgId);
      setMenus(data);
      if (data.length > 0) {
        const active = selectedMenuId ? data.find(m => m.id === selectedMenuId) || data[0] : data[0];
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
    loadTenantMenus();
  }, [selectedOrgId]);

  // When selectedMenuId changes, update items
  useEffect(() => {
    if (selectedMenuId && menus.length > 0) {
      const active = menus.find(m => m.id === selectedMenuId);
      if (active) {
        setMenuItems(active.items || []);
      }
    }
  }, [selectedMenuId, menus]);

  // Build Tree Data from flat items
  const treeData = useMemo(() => {
    const itemMap = new Map<number, DataNode & { raw: TenantMenuItem }>();
    const roots: (DataNode & { raw: TenantMenuItem })[] = [];

    menuItems.forEach((item) => {
      itemMap.set(item.id, {
        key: item.id,
        title: item.title,
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
    return [
      { label: "Root Level (No Parent)", value: 0 },
      ...menuItems
        .filter((item) => !editingItem || item.id !== editingItem.id)
        .map((item) => ({
          label: `${item.title} (${item.url})`,
          value: item.id,
        })),
    ];
  }, [menuItems, editingItem]);

  const handleSelectNode: TreeProps["onSelect"] = (selectedKeys, info) => {
    if (selectedKeys.length > 0) {
      const id = Number(selectedKeys[0]);
      setSelectedKey(id);
      const raw = (info.node as any).raw as TenantMenuItem;
      if (raw) {
        setEditingItem(raw);
        form.setFieldsValue({
          title: raw.title,
          url: raw.url,
          target: raw.target || "_self",
          parentId: raw.parentId || 0,
          orderIndex: raw.orderIndex || 0,
          isVisible: raw.isVisible ?? true,
        });
      }
    } else {
      setSelectedKey(null);
      setEditingItem(null);
      form.resetFields();
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setSelectedKey(null);
    form.resetFields();
    form.setFieldsValue({
      target: "_self",
      parentId: 0,
      orderIndex: (menuItems.length + 1),
      isVisible: true,
      url: "/",
    });
  };

  const onFinish = async (values: any) => {
    if (!selectedMenuId) {
      message.error("Please select or create a navigation menu first");
      return;
    }

    try {
      setSaving(true);
      const payload: Partial<TenantMenuItem> = {
        menuId: selectedMenuId,
        title: values.title,
        url: values.url,
        target: values.target,
        parentId: values.parentId === 0 ? null : values.parentId,
        orderIndex: Number(values.orderIndex) || 0,
        isVisible: Boolean(values.isVisible),
      };

      if (editingItem) {
        await tenantCmsService.updateMenuItem(editingItem.id, payload, selectedOrgId);
        message.success("Navigation item updated");
      } else {
        await tenantCmsService.createMenuItem(payload, selectedOrgId);
        message.success("Navigation item added to menu");
      }

      await loadTenantMenus();
      handleAddNew();
    } catch {
      message.error("Failed to persist navigation item");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await tenantCmsService.deleteMenuItem(id, selectedOrgId);
      message.success("Navigation item removed");
      await loadTenantMenus();
      handleAddNew();
    } catch {
      message.error("Failed to delete navigation item");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Navigation & Menu Management</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">
              Multi-Tenant
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Customize header navigation, footer links, and stakeholder portal menus per organization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Super Admin Tenant Selector */}
          {isSuperAdmin && orgs.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border">
              <span className="text-xs font-semibold text-muted-foreground ml-1">Tenant:</span>
              <select
                aria-label="Select Target Tenant Organization"
                value={selectedOrgId || ""}
                onChange={(e) => setSelectedOrgId(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold focus:outline-none pr-2 cursor-pointer"
              >
                {orgs.map((org) => (
                  <option key={org.id} value={org.id} className="text-slate-900">
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button icon={<ReloadOutlined />} onClick={loadTenantMenus} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew} style={{ backgroundColor: brandColor }}>
            Add Item
          </Button>
        </div>
      </div>

      {/* Menu Location Selector */}
      {menus.length > 0 && (
        <div className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-xl border">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Select Menu Target:</span>
          <div className="flex gap-2">
            {menus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => setSelectedMenuId(menu.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedMenuId === menu.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background hover:bg-muted text-muted-foreground"
                }`}
              >
                {menu.name} ({menu.location})
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <Spin size="large" />
          <p className="text-xs text-muted-foreground mt-3">Loading tenant menu hierarchy...</p>
        </div>
      ) : (
        <Row gutter={24}>
          {/* Left: Tree Structure */}
          <Col xs={24} md={10}>
            <Card
              title={
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Hierarchy Preview</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {menuItems.length} links configured
                  </span>
                </div>
              }
              style={{ borderColor: BORDER_COLOR }}
            >
              {treeData.length === 0 ? (
                <Empty description="No menu items configured for this tenant" />
              ) : (
                <Tree
                  showLine
                  switcherIcon={<DownOutlined />}
                  treeData={treeData}
                  selectedKeys={selectedKey ? [selectedKey] : []}
                  onSelect={handleSelectNode}
                  className="py-2"
                />
              )}
            </Card>
          </Col>

          {/* Right: Item Form */}
          <Col xs={24} md={14}>
            <Card
              title={
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {editingItem ? `Edit: ${editingItem.title}` : "Add New Navigation Link"}
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
                    <Form.Item label="Item Visible" name="isVisible" valuePropName="checked">
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
      )}
    </div>
  );
}

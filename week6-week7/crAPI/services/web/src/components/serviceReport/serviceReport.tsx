/*
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react";
import { Card, Descriptions, Spin, Layout, Timeline, Typography } from "antd";
import { PageHeader } from "@ant-design/pro-components";
import { Content } from "antd/es/layout/layout";
import {
  FileTextOutlined,
  UserOutlined,
  CarOutlined,
  ToolOutlined,
  CommentOutlined,
  CalendarOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import "./styles.css";

const { Title, Text } = Typography;

interface Owner {
  email: string;
  number: string;
}

interface Vehicle {
  owner: Owner;
  id: string;
  vin: string;
}

interface Mechanic {
  mechanic_code: string;
  user: Owner;
}

interface Service {
  id: string;
  problem_details: string;
  created_on: string;
  vehicle: Vehicle;
  status: string;
  mechanic: Mechanic;
  comments: {
    comment: string;
    created_on: string;
  }[];
  downloadUrl?: string;
}

interface ServiceReportProps {
  service: Service;
}

const ServiceReport: React.FC<ServiceReportProps> = ({ service }) => {
  if (!service) {
    console.log("Service is undefined");
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusClass = status.toLowerCase().replace(/\s+/g, "-");
    return <div className={`report-status ${statusClass}`}>{status}</div>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Layout className="page-container service-report-page">
      <div className="service-report-header">
        <PageHeader
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FileTextOutlined
                style={{ fontSize: "24px", color: "#8b5cf6" }}
              />
              <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
                Service Report
              </Title>
            </div>
          }
          subTitle={
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <Text style={{ fontSize: "16px", color: "#6b7280" }}>
                Vehicle VIN:{" "}
                <Text strong style={{ color: "#8b5cf6" }}>
                  {service.vehicle.vin}
                </Text>
              </Text>
              <Text style={{ fontSize: "14px", color: "#9ca3af" }}>
                <CalendarOutlined style={{ marginRight: "4px" }} />
                {formatDate(service.created_on)}
              </Text>
            </div>
          }
          extra={[
            <a
              key="1"
              className="download-report-button"
              href={service.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DownloadOutlined />
              Download Report
            </a>,
          ]}
        />
      </div>

      <div className="report-grid">
        {/* Main Report Details */}
        <div>
          <Card className="service-report-card">
            {getStatusBadge(service.status)}

            <div className="section-title">
              <FileTextOutlined style={{ color: "#8b5cf6" }} />
              Report Details
            </div>

            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Report ID">
                {service.id}
              </Descriptions.Item>
              <Descriptions.Item label="Service Status">
                {service.status}
              </Descriptions.Item>
              <Descriptions.Item label="Created On">
                {formatDate(service.created_on)}
              </Descriptions.Item>
              <Descriptions.Item
                label="Problem Details"
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {service.problem_details}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Comments Section */}
          <Card className="comments-card">
            <div className="section-title">
              <CommentOutlined style={{ color: "#8b5cf6" }} />
              Service Comments
            </div>

            {service.comments && service.comments.length > 0 ? (
              <Timeline
                mode="left"
                items={service.comments.map((comment, index) => ({
                  label: formatDate(comment.created_on),
                  children: comment.comment,
                  color: index === 0 ? "#8b5cf6" : "#6b7280",
                }))}
              />
            ) : (
              <Text style={{ color: "#9ca3af", fontStyle: "italic" }}>
                No comments available for this service.
              </Text>
            )}
          </Card>
        </div>

        {/* Sidebar Information */}
        <div>
          {/* Assigned Mechanic */}
          <Card className="info-card">
            <div className="section-title">
              <ToolOutlined style={{ color: "#8b5cf6" }} />
              Assigned Mechanic
            </div>

            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Mechanic Code">
                {service.mechanic.mechanic_code}
              </Descriptions.Item>
              <Descriptions.Item label="Mechanic Email">
                {service.mechanic.user.email}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Vehicle Information */}
          <Card className="info-card">
            <div className="section-title">
              <CarOutlined style={{ color: "#8b5cf6" }} />
              Vehicle Information
            </div>

            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Vehicle VIN">
                {service.vehicle.vin}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Owner Information */}
          <Card className="info-card">
            <div className="section-title">
              <UserOutlined style={{ color: "#8b5cf6" }} />
              Owner Information
            </div>

            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Owner Email">
                {service.vehicle.owner.email}
              </Descriptions.Item>
              <Descriptions.Item label="Owner Phone">
                {service.vehicle.owner.number}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceReport;

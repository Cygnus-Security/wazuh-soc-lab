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
import { Card, Row, Col, Layout, Badge, Typography } from "antd";
import { PageHeader } from "@ant-design/pro-components";
import { EyeOutlined, CalendarOutlined, ToolOutlined } from "@ant-design/icons";
import "./styles.css";

const { Meta } = Card;
const { Text, Title } = Typography;

interface Owner {
  email: string;
  number: string;
}

interface Vehicle {
  owner: Owner;
  id: string;
  vin: string;
}

interface Service {
  id: string;
  problem_details: string;
  created_on: string;
  vehicle: Vehicle;
  status: string;
}

interface VehicleServiceDashboardProps {
  services: Service[];
}

const VehicleServiceDashboard: React.FC<VehicleServiceDashboardProps> = ({
  services,
}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const VIN = urlParams.get("VIN");

  const getStatusBadge = (status: string) => {
    const statusClass = status.toLowerCase().replace(/\s+/g, "-");
    return <div className={`service-status ${statusClass}`}>{status}</div>;
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
    <Layout className="page-container service-history-page">
      <div className="page-header">
        <PageHeader
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ToolOutlined style={{ fontSize: "24px", color: "#8b5cf6" }} />
              <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
                Service History
              </Title>
            </div>
          }
          subTitle={
            <Text style={{ fontSize: "16px", color: "#6b7280" }}>
              Vehicle VIN:{" "}
              <Text strong style={{ color: "#8b5cf6" }}>
                {VIN}
              </Text>
            </Text>
          }
        />
      </div>

      {services.length === 0 ? (
        <div className="empty-services">
          <h3>No Service Records Found</h3>
          <p>No service history available for this vehicle.</p>
        </div>
      ) : (
        <Row gutter={[32, 32]}>
          {services.map((service: Service) => (
            <Col xs={24} sm={12} lg={8} key={service.id}>
              <Card
                hoverable
                className="service-card"
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <ToolOutlined style={{ color: "#8b5cf6" }} />
                    <Text strong style={{ fontSize: "16px" }}>
                      Service Request
                    </Text>
                  </div>
                }
              >
                {getStatusBadge(service.status)}

                <div className="service-details">
                  <div className="service-detail-item">
                    <div className="service-detail-label">Problem Details</div>
                    <div className="service-detail-value">
                      {service.problem_details}
                    </div>
                  </div>

                  <div className="service-detail-item">
                    <div className="service-detail-label">
                      <CalendarOutlined style={{ marginRight: "4px" }} />
                      Service Date
                    </div>
                    <div className="service-detail-value">
                      {formatDate(service.created_on)}
                    </div>
                  </div>

                  <div className="service-detail-item">
                    <div className="service-detail-label">Vehicle VIN</div>
                    <div className="service-detail-value">
                      {service.vehicle.vin}
                    </div>
                  </div>

                  <div className="service-detail-item">
                    <div className="service-detail-label">Owner Email</div>
                    <div className="service-detail-value">
                      {service.vehicle.owner.email}
                    </div>
                  </div>

                  <div className="service-detail-item">
                    <div className="service-detail-label">Owner Phone</div>
                    <div className="service-detail-value">
                      {service.vehicle.owner.number}
                    </div>
                  </div>
                </div>

                <a
                  href={`/service-report?id=${service.id}`}
                  className="view-report-link"
                >
                  <EyeOutlined />
                  View Service Report
                </a>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Layout>
  );
};

export default VehicleServiceDashboard;

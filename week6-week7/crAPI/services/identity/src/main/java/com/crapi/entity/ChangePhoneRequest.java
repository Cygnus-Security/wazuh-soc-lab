package com.crapi.entity;

import com.crapi.enums.EStatus;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "otp_phoneNumberChange")
@Data
public class ChangePhoneRequest {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private long id;

  @Column(name = "new_phone")
  private String newPhone;

  @Column(name = "old_phone")
  private String oldPhone;

  @Column(name = "otp")
  private String otp;

  private String status;

  @OneToOne private User user;

  public ChangePhoneRequest() {}

  public ChangePhoneRequest(String newPhone, String oldPhone, String otp, User user) {
    this.newPhone = newPhone;
    this.oldPhone = oldPhone;
    this.otp = otp;
    this.user = user;
    this.status = EStatus.ACTIVE.toString();
  }
}

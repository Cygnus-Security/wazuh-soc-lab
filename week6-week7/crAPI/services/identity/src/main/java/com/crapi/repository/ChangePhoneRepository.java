package com.crapi.repository;

import com.crapi.entity.ChangePhoneRequest;
import com.crapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChangePhoneRepository extends JpaRepository<ChangePhoneRequest, Long> {
  ChangePhoneRequest findByUser(User user);
}

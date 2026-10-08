package com.crapi.controller;

import com.crapi.model.CRAPIResponse;
import com.crapi.model.ChangePhoneForm;
import com.crapi.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin
@RestController
@RequestMapping("/identity/api")
public class ChangePhoneController {
  @Autowired UserService userService;

  /**
   * @param changePhoneForm changePhoneForm contains old phone number and new phone number, api will
   *     send otp to email address.
   * @param request getting jwt token for user from request header
   * @return first check phone number is already registered or not if it is there then return phone
   *     number already registered then try with new phone number.
   */
  @PostMapping("/v2/user/change-phone-number")
  public ResponseEntity<CRAPIResponse> changesPhone(
      @Valid @RequestBody ChangePhoneForm changePhoneForm, HttpServletRequest request) {
    CRAPIResponse changePhoneResponse = userService.changePhoneRequest(request, changePhoneForm);
    if (changePhoneResponse != null && changePhoneResponse.getStatus() == 403) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(changePhoneResponse);
    } else if (changePhoneResponse != null && changePhoneResponse.getStatus() == 404) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(changePhoneResponse);
    }
    return ResponseEntity.status(HttpStatus.OK).body(changePhoneResponse);
  }

  /**
   * @param changePhoneForm changeEmailForm contains old phone number and new phone number, with
   *     otp, this function will verify number and otp
   * @param request getting jwt token for user from request header
   * @return verify if otp is valid then it will update the user phone number
   */
  @PostMapping("v2/user/verify-phone-otp")
  public ResponseEntity<CRAPIResponse> verifyPhoneOTP(
      @RequestBody ChangePhoneForm changePhoneForm, HttpServletRequest request) {
    CRAPIResponse verifyPhoneOTPResponse = userService.verifyPhoneOTP(request, changePhoneForm);
    if (verifyPhoneOTPResponse != null && verifyPhoneOTPResponse.getStatus() == 200) {
      return ResponseEntity.status(HttpStatus.OK).body(verifyPhoneOTPResponse);
    } else if (verifyPhoneOTPResponse != null && verifyPhoneOTPResponse.getStatus() == 404) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(verifyPhoneOTPResponse);
    }
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(verifyPhoneOTPResponse);
  }
}

/*
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.crapi.config;

import com.crapi.constant.UserMessage;
import com.crapi.enums.EStatus;
import com.crapi.service.Impl.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.util.Base64;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

enum ApiType {
  JWT,
  APIKEY,
  BASIC;
}

@Slf4j
public class JwtAuthTokenFilter extends OncePerRequestFilter {

  @Autowired private JwtProvider tokenProvider;

  @Autowired private UserDetailsServiceImpl userDetailsService;

  @Autowired private AuthenticationManager authenticationManager;

  /**
   * @param request
   * @param response
   * @param filterChain
   * @throws ServletException
   * @throws IOException
   */
  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    try {
      ApiType apiType = getKeyType(request);

      // Handle Basic Auth separately
      if (apiType == ApiType.BASIC) {
        handleBasicAuth(request, response);
      } else {
        // Handle JWT and API Key
        String username = getUserFromToken(request);
        if (username != null && !username.equalsIgnoreCase(EStatus.INVALID.toString())) {
          UserDetails userDetails = userDetailsService.loadUserByUsername(username);
          if (userDetails == null) {
            log.error("User not found");
            response.sendError(
                HttpServletResponse.SC_UNAUTHORIZED, UserMessage.INVALID_CREDENTIALS);
          }
          if (userDetails.isAccountNonLocked()) {
            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
          } else {
            log.error(UserMessage.ACCOUNT_LOCKED_MESSAGE);
            response.sendError(
                HttpServletResponse.SC_UNAUTHORIZED, UserMessage.ACCOUNT_LOCKED_MESSAGE);
          }
        }
      }
    } catch (Exception e) {
      log.error("Can NOT set user authentication -> Message:%d", e);
    }

    filterChain.doFilter(request, response);
  }

  /**
   * Handle Basic Authentication
   *
   * @param request HttpServletRequest
   * @param response HttpServletResponse
   */
  private void handleBasicAuth(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    String authHeader = request.getHeader("Authorization");
    if (authHeader == null || !authHeader.startsWith("Basic ")) {
      return;
    }

    try {
      // Decode Base64 credentials
      String base64Credentials = authHeader.substring(6);
      byte[] decodedBytes = Base64.getDecoder().decode(base64Credentials);
      String credentials = new String(decodedBytes, StandardCharsets.UTF_8);

      // Split into email:password
      int colonIndex = credentials.indexOf(':');
      if (colonIndex == -1) {
        log.error("Invalid Basic Auth format - missing colon separator");
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, UserMessage.INVALID_CREDENTIALS);
        return;
      }

      String email = credentials.substring(0, colonIndex);
      String password = credentials.substring(colonIndex + 1);

      log.debug("Attempting Basic Auth for user: {}", email);

      // Authenticate using AuthenticationManager
      Authentication authentication =
          authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(email, password));

      // Get UserDetails and check if account is locked
      UserDetails userDetails = userDetailsService.loadUserByUsername(email);
      if (userDetails == null) {
        log.error("User not found for Basic Auth");
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, UserMessage.INVALID_CREDENTIALS);
        return;
      }

      if (!userDetails.isAccountNonLocked()) {
        log.error(UserMessage.ACCOUNT_LOCKED_MESSAGE);
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, UserMessage.ACCOUNT_LOCKED_MESSAGE);
        return;
      }

      // Set authentication in SecurityContext
      UsernamePasswordAuthenticationToken authToken =
          new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
      authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
      SecurityContextHolder.getContext().setAuthentication(authToken);

      log.debug("Basic Auth successful for user: {}", email);

    } catch (BadCredentialsException e) {
      log.error("Basic Auth failed - invalid credentials");
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, UserMessage.INVALID_CREDENTIALS);
    } catch (IllegalArgumentException e) {
      log.error("Basic Auth failed - invalid Base64 encoding");
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, UserMessage.INVALID_CREDENTIALS);
    }
  }

  /**
   * @param request
   * @return key/token
   */
  public String getToken(HttpServletRequest request) {
    String authHeader = request.getHeader("Authorization");

    // checking token is there or not
    if (authHeader != null && authHeader.length() > 7) {
      return authHeader.substring(7);
    }
    return null;
  }

  /**
   * @param request
   * @return api type from HttpServletRequest
   */
  public ApiType getKeyType(HttpServletRequest request) {
    String authHeader = request.getHeader("Authorization");
    ApiType apiType = ApiType.JWT;
    if (authHeader != null) {
      if (authHeader.startsWith("ApiKey ")) {
        apiType = ApiType.APIKEY;
      } else if (authHeader.startsWith("Basic ")) {
        apiType = ApiType.BASIC;
      }
    }
    return apiType;
  }

  /**
   * @param request
   * @return return username from HttpServletRequest if request have token we are returning username
   *     from request token
   */
  public String getUserFromToken(HttpServletRequest request) throws ParseException {
    ApiType apiType = getKeyType(request);
    String token = getToken(request);
    String username = null;
    if (token != null) {
      if (apiType == ApiType.APIKEY) {
        log.debug("Token is api token");
        username = tokenProvider.getUserNameFromJwtToken(token);
      } else {
        log.debug("Token is jwt token");
        if (tokenProvider.validateJwtToken(token)) {
          username = tokenProvider.getUserNameFromJwtToken(token);
        }
      }
      // checking username from token
      if (username != null) return username;
    }
    return EStatus.INVALID.toString();
  }
}

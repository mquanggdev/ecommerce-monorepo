import { Socket } from "socket.io";
import * as cookie from 'cookie';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const authSocket = (socket: Socket, next: any) => {
  try {
    const cookieString = socket.handshake.headers.cookie; // chuỗi cookie từ header của request gửi lên khi kết nối socket. Cookie này là cookie mà browesr gửi lên , không phải do socket.io tự tạo ra
    if(cookieString) {
      const cookieParsed = cookie.parse(cookieString);
      
      let token: string = "";
      let role: string = "";
      let roomId: string = "";

      if(cookieParsed.tokenAdmin) {
        token = cookieParsed.tokenAdmin;
        role = "admin";
        roomId = `${socket.handshake.auth.roomId}`;
      } else if(cookieParsed.tokenUser) {
        token = cookieParsed.tokenUser;
        role = "user";
      }

      if(token && role) {
        const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as JwtPayload;
        
        if(decoded && decoded.id && decoded.email) {
          socket.data.account = { // Khi giải mã token thì ta sẽ có thông tin người dùng và gán nó vào socket.data.account để có thể sử dụng thông tin này ở các socket khác
            id: decoded.id,
            email: decoded.email,
            role: role,
            roomId: roomId
          };
        }
      }
    }
    next();
  } catch (error) {
    console.log(error);
  }
}

# ecommerce-api

RESTful API cho hệ thống thương mại điện tử (MVP): Node.js, Express, Prisma 7, PostgreSQL, JWT, Docker Compose.

## Chức năng

- Đăng ký, đăng nhập, bảo mật bằng JWT (mật khẩu băm bằng bcrypt)
- Phân quyền: `ADMIN` và `USER`
- Product: ai cũng xem được, chỉ ADMIN tạo, sửa, xóa
- Order và OrderDetail: tạo đơn trong một transaction, tự trừ kho, lưu giá tại thời điểm mua
- Shipment: ADMIN tạo và cập nhật trạng thái, chủ đơn xem được
- Health check `/health` kiểm tra kết nối database

## Cấu trúc dữ liệu

Role, MemberShip, User, Order, OrderDetail, Product, Shipment (xem `prisma/schema.prisma`).

## Chạy bằng Docker Compose

1. Tạo file `.env` từ mẫu và điền giá trị thật:

```bash
cp .env.example .env
```

2. Chạy:

```bash
docker compose up -d --build
```

3. Chờ khoảng 40 giây đến khi cả hai container `(healthy)`:

```bash
docker compose ps
curl http://localhost:3001/health
```

Khi khởi động, API tự tạo bảng (`prisma migrate deploy`) và seed Role, MemberShip.

## Biến môi trường (`.env`)

| Biến | Ý nghĩa |
|---|---|
| `PORT` | Cổng API (3001) |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL (dùng khi chạy ngoài Docker) |
| `JWT_SECRET` | Khóa ký JWT |
| `JWT_EXPIRES_IN` | Thời hạn token, ví dụ `1d` |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Cấu hình PostgreSQL cho Docker Compose |

## API

| Phương thức | Đường dẫn | Quyền |
|---|---|---|
| GET | `/health` | công khai |
| POST | `/api/auth/register` | công khai |
| POST | `/api/auth/login` | công khai |
| GET | `/api/auth/me` | đăng nhập |
| GET | `/api/products`, `/api/products/:pid` | công khai |
| POST, PUT, DELETE | `/api/products` | ADMIN |
| POST | `/api/orders` | đăng nhập |
| GET | `/api/orders`, `/api/orders/:oid` | đăng nhập (chủ đơn hoặc ADMIN) |
| POST, PUT | `/api/shipments` | ADMIN |
| GET | `/api/shipments/order/:oid` | chủ đơn hoặc ADMIN |

Gửi token qua header `Authorization: Bearer <token>`.

## Tạo tài khoản ADMIN đầu tiên

Đăng ký luôn cấp quyền `USER`. Nâng quyền trực tiếp trong database:

```bash
docker exec ecommerce-postgres psql -U postgres -d ecommerce -c "UPDATE users SET roleid=(SELECT roleid FROM roles WHERE rolename='ADMIN') WHERE username='an';"
```

Sau đó đăng nhập lại để nhận token mới.
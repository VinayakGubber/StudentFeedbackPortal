# Student Feedback Portal

## 🛠️ Infrastructure Plan

- React frontend hosted on S3 (served via CloudFront)
- Node.js backend hosted on EC2 (private subnet)
- ALB in public subnet to route traffic to EC2
- MySQL RDS in private subnet
- File uploads stored in S3 using IAM Role
- JWT for authentication, signed URLs for file access

## 📦 Steps to Deploy

1. **Create Resources**

   - VPC with public & private subnets
   - EC2 (private subnet) with IAM role for S3
   - RDS MySQL (private subnet)
   - ALB (public subnet) to target EC2

2. **Backend Setup**

   ```bash
   cd server
   cp .env.example .env
   # fill in actual values (RDS endpoint, S3 bucket, secret)
   npm install
   node index.js
   ```

3. **Frontend Build & Upload**

   ```bash
   cd client
   npm install
   npm run build
   aws s3 sync dist/ s3://your-s3-bucket-name
   ```

4. **CloudFront (optional)**
   - Point to S3 bucket for static hosting
   - Use for production URL

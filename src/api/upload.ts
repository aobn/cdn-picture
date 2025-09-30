/**
 * 图片上传 API 服务
 */

const API_BASE_URL = '/upload';
const AUTH_TOKEN = '4iuBV1a90xgH5ZDNRYOuqgPDwPA';

/**
 * 上传凭证响应接口
 */
export interface UploadCredentialResponse {
  upload_url: string;
  token: string;
  assets: {
    path: string;
  };
}

/**
 * 上传请求参数接口
 */
export interface UploadRequest {
  name: string;
  size: number;
}

/**
 * 上传结果接口
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 获取上传凭证
 * @param file 要上传的文件
 * @returns 上传凭证信息
 */
export async function getUploadCredential(file: File): Promise<UploadCredentialResponse> {
  const response = await fetch(`${API_BASE_URL}/imgs`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Authorization': AUTH_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
    }),
  });

  if (!response.ok) {
    throw new Error(`获取上传凭证失败: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * 上传文件内容
 * @param uploadUrl 上传地址
 * @param file 文件对象
 * @returns 上传是否成功
 */
export async function uploadFileContent(uploadUrl: string, file: File): Promise<boolean> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: file,
  });

  return response.ok || response.status === 201 || response.status === 204;
}

/**
 * 完整的图片上传流程
 * @param file 要上传的文件
 * @returns 上传结果
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  try {
    // 第一步：获取上传凭证
    const credential = await getUploadCredential(file);
    
    // 第二步：上传文件内容
    const uploadSuccess = await uploadFileContent(credential.upload_url, file);
    
    if (uploadSuccess) {
      return {
        success: true,
        url: `https://cnb.cool${credential.assets.path}`,
      };
    } else {
      return {
        success: false,
        error: '文件上传失败',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传过程中发生未知错误',
    };
  }
}
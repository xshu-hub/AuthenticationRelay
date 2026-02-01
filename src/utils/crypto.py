"""
加密工具类 - 使用 Fernet 对称加密
"""
import os
import base64
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class CryptoManager:
    """加密管理器"""
    
    def __init__(self, key: str | None = None, key_file: Path | None = None):
        """
        初始化加密管理器
        
        Args:
            key: 加密密钥 (base64 编码的 32 字节密钥)
            key_file: 密钥文件路径，如果 key 为 None 则尝试从文件加载或生成新密钥
        """
        self._fernet: Fernet | None = None
        self._key_file = key_file
        
        if key:
            self._init_from_key(key)
        elif key_file:
            self._init_from_file(key_file)
        else:
            raise ValueError("必须提供 key 或 key_file 参数")
    
    def _init_from_key(self, key: str) -> None:
        """从密钥字符串初始化"""
        try:
            self._fernet = Fernet(key.encode() if isinstance(key, str) else key)
        except Exception as e:
            raise ValueError(f"无效的加密密钥: {e}")
    
    def _init_from_file(self, key_file: Path) -> None:
        """从文件加载或生成密钥"""
        if key_file.exists():
            key = key_file.read_text().strip()
            self._init_from_key(key)
        else:
            # 生成新密钥并保存
            key = Fernet.generate_key().decode()
            key_file.parent.mkdir(parents=True, exist_ok=True)
            key_file.write_text(key)
            self._init_from_key(key)
    
    @staticmethod
    def generate_key() -> str:
        """生成新的加密密钥"""
        return Fernet.generate_key().decode()
    
    @staticmethod
    def derive_key_from_password(password: str, salt: bytes | None = None) -> tuple[str, bytes]:
        """
        从密码派生加密密钥
        
        Args:
            password: 用户密码
            salt: 盐值，如果为 None 则生成新的
            
        Returns:
            (密钥, 盐值) 元组
        """
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key.decode(), salt
    
    def encrypt(self, plaintext: str) -> str:
        """
        加密字符串
        
        Args:
            plaintext: 明文字符串
            
        Returns:
            加密后的 base64 编码字符串
        """
        if not self._fernet:
            raise RuntimeError("加密管理器未正确初始化")
        
        encrypted = self._fernet.encrypt(plaintext.encode())
        return encrypted.decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """
        解密字符串
        
        Args:
            ciphertext: 加密的 base64 编码字符串
            
        Returns:
            解密后的明文字符串
        """
        if not self._fernet:
            raise RuntimeError("加密管理器未正确初始化")
        
        decrypted = self._fernet.decrypt(ciphertext.encode())
        return decrypted.decode()
    
    def encrypt_dict(self, data: dict, fields: list[str]) -> dict:
        """
        加密字典中指定字段
        
        Args:
            data: 原始字典
            fields: 需要加密的字段列表
            
        Returns:
            加密后的字典副本
        """
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                result[field] = self.encrypt(str(result[field]))
        return result
    
    def decrypt_dict(self, data: dict, fields: list[str]) -> dict:
        """
        解密字典中指定字段
        
        Args:
            data: 加密的字典
            fields: 需要解密的字段列表
            
        Returns:
            解密后的字典副本
        """
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                result[field] = self.decrypt(str(result[field]))
        return result


# 全局加密管理器实例（延迟初始化）
_crypto_manager: CryptoManager | None = None


def get_crypto_manager() -> CryptoManager:
    """获取全局加密管理器实例"""
    global _crypto_manager
    if _crypto_manager is None:
        raise RuntimeError("加密管理器未初始化，请先调用 init_crypto_manager()")
    return _crypto_manager


def init_crypto_manager(key: str | None = None, key_file: Path | None = None) -> CryptoManager:
    """
    初始化全局加密管理器
    
    Args:
        key: 加密密钥
        key_file: 密钥文件路径
        
    Returns:
        加密管理器实例
    """
    global _crypto_manager
    _crypto_manager = CryptoManager(key=key, key_file=key_file)
    return _crypto_manager

import os
from typing import Any, AsyncIterator, Iterable, List, MutableMapping, Optional, Literal

from dotenv import load_dotenv
from openai import AsyncOpenAI, OpenAI

load_dotenv()

ChatMessage = MutableMapping[str, Any]
APIProvider = Literal["openai", "together"]


class ChatOpenAI:
    """Enhanced wrapper around OpenAI and Together AI chat completion APIs."""

    def __init__(
        self, 
        model_name: str = "gpt-4o-mini",
        api_provider: APIProvider = "openai",
        api_key: Optional[str] = None
    ):
        self.model_name = model_name
        self.api_provider = api_provider
        
        if api_provider == "openai":
            self.api_key = api_key or os.getenv("OPENAI_API_KEY")
            if self.api_key is None:
                raise ValueError("OPENAI_API_KEY is not set")
            self._client = OpenAI(api_key=self.api_key)
            self._async_client = AsyncOpenAI(api_key=self.api_key)
            
        elif api_provider == "together":
            # Import together here to make it optional
            try:
                import together
            except ImportError:
                raise ImportError("together package is required for Together AI. Install with: pip install together")
            
            self.api_key = api_key or os.getenv("TOGETHER_API_KEY")
            if self.api_key is None:
                raise ValueError("TOGETHER_API_KEY is not set")
            
            # Together AI uses OpenAI-compatible client
            self._client = OpenAI(
                api_key=self.api_key,
                base_url="https://api.together.xyz/v1"
            )
            self._async_client = AsyncOpenAI(
                api_key=self.api_key,
                base_url="https://api.together.xyz/v1"
            )
        else:
            raise ValueError(f"Unsupported API provider: {api_provider}")

    def run(
        self,
        messages: Iterable[ChatMessage],
        text_only: bool = True,
        **kwargs: Any,
    ) -> Any:
        """Execute a chat completion request.

        ``messages`` must be an iterable of ``{"role": ..., "content": ...}``
        dictionaries. When ``text_only`` is ``True`` (the default) only the
        completion text is returned; otherwise the full response object is
        provided.
        """

        message_list = self._coerce_messages(messages)
        response = self._client.chat.completions.create(
            model=self.model_name, messages=message_list, **kwargs
        )

        if text_only:
            return response.choices[0].message.content

        return response

    async def astream(
        self, messages: Iterable[ChatMessage], **kwargs: Any
    ) -> AsyncIterator[str]:
        """Yield streaming completion chunks as they arrive from the API."""

        message_list = self._coerce_messages(messages)
        stream = await self._async_client.chat.completions.create(
            model=self.model_name, messages=message_list, stream=True, **kwargs
        )

        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content is not None:
                yield content

    def _coerce_messages(self, messages: Iterable[ChatMessage]) -> List[ChatMessage]:
        if isinstance(messages, list):
            return messages
        return list(messages)
    
    @classmethod
    def get_available_models(cls, api_provider: APIProvider = "openai") -> List[str]:
        """Get list of available models for the specified provider."""
        if api_provider == "openai":
            return [
                "gpt-4o-mini",
                "gpt-4o",
                "gpt-4-turbo",
                "gpt-4",
                "gpt-3.5-turbo"
            ]
        elif api_provider == "together":
            return [
                "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
                "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
                "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
                "mistralai/Mixtral-8x7B-Instruct-v0.1",
                "mistralai/Mixtral-8x22B-Instruct-v0.1",
                "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO",
                "Qwen/Qwen2-72B-Instruct",
                "microsoft/DialoGPT-medium"
            ]
        else:
            raise ValueError(f"Unsupported API provider: {api_provider}")
    
    def get_provider_info(self) -> dict:
        """Get information about the current API provider and model."""
        return {
            "provider": self.api_provider,
            "model": self.model_name,
            "base_url": getattr(self._client, "base_url", "https://api.openai.com/v1") if hasattr(self._client, "base_url") else "https://api.openai.com/v1"
        }

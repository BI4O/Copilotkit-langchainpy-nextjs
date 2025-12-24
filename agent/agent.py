from langchain.chat_models import init_chat_model
from langchain.agents import create_agent
from langchain.tools import tool
from dotenv import load_dotenv

load_dotenv()

@tool
def get_weather(city: str) -> str:
    """Get the current weather for a given city."""
    # Placeholder implementation
    return f"The current weather in {city} is sunny with a temperature of 25°C."

agent = create_agent(
    model=init_chat_model("openai:kimi-k2"),
    tools=[get_weather],
    system_prompt="You are a helpful weather assistant."
)

if __name__ == "__main__":
    state = agent.invoke({"messages":"Tell me the weather in New York City."})
    state["messages"][-1].pretty_print()
import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .react-resizable {
    position: relative;
  }

  .react-resizable-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    background-repeat: no-repeat;
    background-origin: content-box;
    box-sizing: border-box;
    background-image: url('data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZm9jdXNhYmxlPSJmYWxzZSIgZGF0YS1wcmVjYXNpZ249ImZhLXZzdiIgcm9sZT0iaW1nIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NDggNTEyIiBjbGFzcz0ic3ZnLWlubGluZS0tZmEtdnN2IGZhLWdyYXNzZXIgZmEtd3JhcHBlciI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMjI0IDQxNmMtMTcuNyAwLTMxLjYtMTQuMy0zMS42LTMxLjZWMTAwLjRjMC0xNy43IDE0LjMtMzEuNiAzMS42LTMxLjZzMzEuNiAxNC4zIDMxLjYgMzEuNlY0MTZjMCAxNy43LTE0LjMgMzEuNi0zMS42IDMxLjZ6IiBjbGFzcz0iIj48L3BhdGg+PHBhdGggZmlsbD0iY3Vycm9yQ29sb3IiIGQ9Ik00MTYgMjI0Yy0xNy43IDAtMzEuNi0xNC4zLTMxLjYtMzEuNlYxMDAuNGMwLTE3LjcgMTQuMy0zMS42IDMxLjYtMzEuNnMyMS42IDE0LjMgMjEuNiAzMS42VjQxNmMwIDE3LjctMTQuMyAzMS42LTMxLjYgMzEuNnptLTMyMCAwYy0xNy43IDAtMzEuNi0xNC4zLTMxLjYtMzEuNlYxMDAuNGMwLTE3LjcgMTQuMy0zMS42IDMxLjYtMzEuNnMyMS42IDE0LjMgMjEuNiAzMS42VjQxNmMwIDE3LjctMTQuMyAzMS42LTMxLjYgMzEuNnptMTYwIDMyMGMtMTcuNyAwLTMxLjYtMTQuMy0zMS42LTMxLjZWMTAwLjRjMC0xNy43IDE0LjMtMzEuNiAzMS42LTMxLjZzMzEuNiAxNC4zIDMxLjYgMzEuNlY0MTZjMCAxNy43LTE0LjMgMzEuNi0zMS42IDMxLjZ6IiBjbGFzcz0iIj48L3BhdGg+PC9zdmc+');
    background-position: bottom right;
    padding: 0 3px 3px 0;
  }

  .react-resizable-handle-n {
    top: 0;
    left: 0;
    height: 10px;
    width: 100%;
    cursor: row-resize;
    background-position: top center;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
  }

  input[type="text"], input[type="color"] {
    width: 100%;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 3px;
  }

  input[type="checkbox"] {
    margin-left: 5px;
  }

  button {
    padding: 8px 12px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 5px;

    &:hover {
      background-color: #0056b3;
    }
  }

  /* MiniMap 위치 고정 - 하단 레이아웃 드래그 시 딸려올라가지 않도록 */
  .react-flow__minimap {
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    z-index: 1000 !important;
  }
`;
